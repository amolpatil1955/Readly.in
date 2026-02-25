import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  Username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImg: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkpxYROZjMxvGCpx7zhLJZCWES9cl-uG_XXw&s",
  },
  bio: { type: String, default:"add your data about you" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;