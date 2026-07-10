import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

const PORT_A = 4101;
const PORT_B = 4102;

/** A dedicated database, so E2E never touches development data. */
const mongoUri = (
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/chatapp"
).replace(/\/([^/?]+)(\?|$)/, "/zentro_e2e$2");

export const E2E = Object.freeze({
  PORT_A,
  PORT_B,
  SERVER_A: `http://127.0.0.1:${PORT_A}`,
  SERVER_B: `http://127.0.0.1:${PORT_B}`,
  CLIENT_ORIGIN: "http://127.0.0.1:5173",
  MONGO_URI: mongoUri,
  VALKEY_URL: process.env.VALKEY_URL ?? "redis://127.0.0.1:6379",
  JWT_SECRET: process.env.JWT_SECRET ?? "e2e_jwt_secret",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "e2e_session_secret",
  FIXTURES: path.resolve(here, ".tmp/fixtures.json"),
});

/** Env handed to each spawned server. Both share Mongo and Valkey on purpose. */
export const serverEnv = (port) => ({
  ...process.env,
  NODE_ENV: "development", // production would force a Secure cookie over http
  PORT: String(port),
  MONGO_URI: E2E.MONGO_URI,
  VALKEY_URL: E2E.VALKEY_URL,
  JWT_SECRET: E2E.JWT_SECRET,
  SESSION_SECRET: E2E.SESSION_SECRET,
  CLIENT_ORIGIN: E2E.CLIENT_ORIGIN,
  CLIENT_URL: E2E.CLIENT_ORIGIN,
});
