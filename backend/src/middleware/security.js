import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import hpp from "hpp";
import compression from "compression";
import express from "express";

import { sanitizeRequest } from "./sanitizeRequest.js";
import { apiLimiter } from "./rateLimit.js";
import { logger } from "../lib/logger.js";

const MAX_BODY = "10kb"; // chat messages are tiny; nothing legitimate is bigger

/**
 * Everything that must run before the routes, in the order it must run.
 * Order matters: headers first, then logging, then parsing, then sanitising.
 */
export function applySecurity(app, { clientOrigin, isProduction }) {
  // 1. Behind the ALB/Nginx. Required for correct client IPs (rate limiting)
  //    and for req.secure / X-Forwarded-Proto (the OAuth session cookie).
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // 2. Security headers: HSTS, X-Content-Type-Options, frame-ancestors, etc.
  //    CSP is disabled here because this process serves JSON only — Nginx
  //    serves the frontend and owns that policy.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // 3. Access log. Piped through our logger so it's silent under test.
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan(isProduction ? "combined" : "dev", {
        stream: { write: (line) => logger.info(line.trim()) },
        skip: (req) => req.path === "/health" || req.path === "/api/health",
      })
    );
  }

  // 4. Only the frontend may call us, and it must be allowed to send cookies
  //    for the OAuth handshake.
  app.use(cors({ origin: clientOrigin, credentials: true }));

  // 5. Bounded body parsing — an unbounded parser is a trivial memory DoS.
  app.use(express.json({ limit: MAX_BODY }));
  app.use(express.urlencoded({ extended: false, limit: MAX_BODY }));

  // 6. HTTP Parameter Pollution: ?q=a&q=b arrives as an array and breaks
  //    validators that assume a string.
  app.use(hpp());

  // 7. Strip Mongo operators from body/params/query.
  app.use(sanitizeRequest);

  app.use(compression());

  // 8. Baseline throttle for the whole API.
  app.use("/api", apiLimiter);
}
