import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ConnectionDB from "./Config/Database.js";
import Routes from "./routes/user.route.js";

dotenv.config();
ConnectionDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

// ✅ CORS SABSE PEHLE
app.use(cors({
  origin: "https://readly-in-fronted.onrender.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors({
  origin: "https://readly-in-fronted.onrender.com",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ THEN PARSE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ msg: "Backend Running ✅" });
});

app.use("/api/v1/user", Routes);

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});