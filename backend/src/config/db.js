import mongoose from "mongoose";

// Connects this server to MongoDB. Both EC2 servers call this and point at the
// SAME MongoDB, so they share users / rooms / message history.
export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}
