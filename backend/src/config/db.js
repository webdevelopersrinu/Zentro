import mongoose from "mongoose";
import { logger } from "../lib/logger.js";

/**
 * Connects this server to MongoDB. Every app server points at the SAME database,
 * so they share users / rooms / message history.
 */
export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("✅ MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
