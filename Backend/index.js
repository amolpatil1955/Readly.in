import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import ConnectionDB from "./Config/Database.js";
import Routes from "./routes/user.route.js";

ConnectionDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());          
app.use(express.json());



// ── Routes ──
app.get("/", (req, res) => {
  return res.status(200).json({ success: true, message: "PROJECT NOW WORKING ✅" });
});

app.use("/api/vi/user", Routes);

// ── Start ──
app.listen(PORT, () => {
  console.log(`Server is Running ✅ ON PORT ${PORT}`);
});