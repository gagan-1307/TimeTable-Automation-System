import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["ADMIN", "DEPT_ADMIN", "VIEW"],
    default: "VIEW"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
