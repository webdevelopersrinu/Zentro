import mongoose from "mongoose";
import { E2E } from "./env.js";

/** Drop the E2E database and purge the refresh tokens it wrote into Valkey. */
export default async function globalTeardown() {
  await mongoose.connect(E2E.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  const { createValkeyClient } = await import("../src/config/valkey.js");
  const valkey = createValkeyClient(E2E.VALKEY_URL, "e2e-teardown");

  const keys = await valkey.keys("rt*");
  if (keys.length) await valkey.del(...keys);
  valkey.disconnect();
}
