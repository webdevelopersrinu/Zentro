import mongoose from "mongoose";

// A chat room. `creator` is the user who made it — the admin.
//
//   visibility: "public"  → anyone logged in can see it and join instantly.
//   visibility: "private" → anyone can SEE it exists, but must send a join
//                           request that the creator approves. Only `members`
//                           can read or send messages.
//
// `joinRequests` holds users who asked to join a private room and are waiting
// for the creator's decision.
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      index: true,
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
