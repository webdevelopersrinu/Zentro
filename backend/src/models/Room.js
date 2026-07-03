import mongoose from "mongoose";

// A chat room. `creator` is the user who made it ("creator rule").
// `members` are everyone allowed to chat in it (creator + invited users).
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
