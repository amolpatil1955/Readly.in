import express from 'express'
import {Register , Login } from "../Controller/Auth.js"
import { Profile, upload } from "../Controller/Profile.js"
import { createBlog, getAllBlogs, getBlogsByUser, deleteBlog } from "../Controller/Blogs.create.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router()

router.post("/register", Register)
router.post("/login", Login)
router.put("/profile/:id", authMiddleware, upload.single("profileImg"), Profile);
router.post("/blog/create", authMiddleware, upload.single("coverImage"), createBlog);
router.get("/blog/all", getAllBlogs);
router.get("/blog/user/:userId", getBlogsByUser);
router.delete("/blog/:id", authMiddleware, deleteBlog);

export default router

