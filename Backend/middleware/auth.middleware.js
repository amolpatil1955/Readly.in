import jwt from "jsonwebtoken";  // ← yeh line missing thi
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token nahi mila" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.log("Token error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;