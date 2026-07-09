// Loads backend/.env by ABSOLUTE path, independent of the process working
// directory (pm2 / systemd may start us from anywhere).
//
// This lives in its own module and must be the FIRST import in server.js:
// ES modules evaluate every `import` before any code in the importing module's
// body, so a body-level `dotenv.config()` would run AFTER modules like
// config/passport.js have already read process.env — leaving their config
// undefined. Importing this module first guarantees the env is populated before
// anything else evaluates.
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});