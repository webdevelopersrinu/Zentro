import mongoose from "mongoose";

// One chat message saved for history, so users see past messages on rejoin.
const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true }, // denormalized for quick display
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
