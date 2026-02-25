import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Technology",
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const BlogModel = mongoose.model("Blog", BlogSchema);
export default BlogModel;