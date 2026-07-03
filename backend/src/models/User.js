import mongoose from "mongoose";

// One account. `username` is unique — no two users can share it.
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
