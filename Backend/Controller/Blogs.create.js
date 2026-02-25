import BlogModel from "../model/Blogs.model.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: "blog_covers" },
    (error, result) => { if (error) reject(error); else resolve(result); }
  );
  streamifier.createReadStream(buffer).pipe(stream);
});

export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, status } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Title aur content zaroori hai" });

    let coverImage = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      coverImage = result.secure_url;
    }

    const blog = await BlogModel.create({
      title, excerpt, content, category, status,
      tags: JSON.parse(tags || "[]"),  // FormData mein string aata hai
      coverImage,
      author: req.user.id,
    });

    res.status(201).json({ message: "Blog create ho gaya!", blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/vi/blog/all
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogModel.find({ status: "published" })
      .populate("author", "Username email Profile_Img")
      .sort({ createdAt: -1 });

    res.status(200).json({ blogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vi/blog/user/:userId
export const getBlogsByUser = async (req, res) => {
  try {
    const blogs = await BlogModel.find({ author: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ blogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/vi/blog/:id
export const getSingleBlog = async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id)
      .populate("author", "Username email Profile_Img");

    if (!blog) return res.status(404).json({ message: "Blog nahi mila" });

    blog.views += 1;
    await blog.save();

    res.status(200).json({ blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/vi/blog/:id
export const updateBlog = async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog nahi mila" });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Aap is blog ko edit nahi kar sakte" });
    }

    const updated = await BlogModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({ message: "Blog update ho gaya!", blog: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/vi/blog/:id
export const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog nahi mila" });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Aap is blog ko delete nahi kar sakte" });
    }

    await blog.deleteOne();

    res.status(200).json({ message: "Blog delete ho gaya!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};