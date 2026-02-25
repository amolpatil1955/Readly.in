import User from "../model/User.model.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import streamifier from "streamifier";



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed!"), false);
    }
  },
});
 
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profile_images" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const Profile = async (req, res) => {
  try {
    const userId = req.params.id; // auth middleware se aayega
    const { Username, email ,bio } = req.body;

    // Find existing user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profileImg = user.profileImg; 

    if (req.file) {
      // Purana image Cloudinary se delete karo (optional but good practice)
      if (user.profileImg) {
        const publicId = user.profileImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`profile_images/${publicId}`);
      }

      const result = await uploadToCloudinary(req.file.buffer);
      profileImg = result.secure_url;
    }

    // User update karo
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        Username: Username || user.Username,
        email: email || user.email,
        bio: bio || user.bio,
        profileImg,
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }

}


export { Profile };