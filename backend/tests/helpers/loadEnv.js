import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

/**
 * Side-effect module. MUST be imported before anything that reads process.env
 * at module scope (config/passport.js does). ES modules evaluate imports in
 * declaration order, so `import "./loadEnv.js"` first guarantees the env exists.
 */
dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test_jwt_secret";
process.env.SESSION_SECRET ??= "test_session_secret";

// One database per Jest worker. Workers run test files in parallel, so a shared
// database would let one file's reset wipe another's fixtures mid-assertion.
const worker = process.env.JEST_WORKER_ID ?? "1";
const base = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/chatapp";
process.env.MONGO_URI = base.replace(/\/([^/?]+)(\?|$)/, `/zentro_test_w${worker}$2`);
