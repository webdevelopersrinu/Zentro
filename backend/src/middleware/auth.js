import { verifyAccessToken } from "../services/token.service.js";
import { AppError } from "../utils/AppError.js";

const bearer = (req) => {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

/** Verifies the JWT and attaches { id, username, name, avatarUrl } to req.user. */
export const requireAuth = (req, _res, next) => {
  const token = bearer(req);
  if (!token) return next(AppError.unauthorized("Missing token"));

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    // 401 tells the client to silently refresh and retry once.
    next(AppError.unauthorized("Invalid or expired token"));
  }
};
