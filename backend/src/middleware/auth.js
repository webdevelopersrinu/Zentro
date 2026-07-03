import { verifyToken } from "../utils/token.js";

// Protects HTTP routes. Reads "Authorization: Bearer <token>", verifies it,
// and attaches { id, username } to req.user. Rejects if missing/invalid.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
