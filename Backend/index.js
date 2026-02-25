import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectionDB from "./Config/Database.js";
import Routes from "./routes/user.route.js";

dotenv.config();

ConnectionDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS FIX (IMPORTANT)git add .

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://readly-frontend.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// ── Routes ──
app.get("/", (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "PROJECT NOW WORKING ✅" });
});

app.use("/api/v1/user", Routes);

// ── Start ──
app.listen(PORT, () => {
  console.log(`Server is Running ✅ ON PORT ${PORT}`);
});
