import "./loadEnv.js"; // must come first — populates process.env

import mongoose from "mongoose";
import { createApp } from "../../src/app.js";

export const app = createApp();

export async function connectTestDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI);
}

/** Empties every collection between tests without dropping indexes. */
export async function resetTestDB() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
