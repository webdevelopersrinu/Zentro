import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

import passport from "./config/passport.js";
import apiRoutes from "./routes/index.js";
import { applySecurity } from "./middleware/security.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

/**
 * Builds the Express app. Deliberately knows nothing about ports, databases,
 * or Socket.IO — so tests can mount it with supertest and no listening server.
 */
export function createApp() {
  const {
    CLIENT_ORIGIN = "*",
    SESSION_SECRET = "dev_session_secret",
    NODE_ENV = "development",
  } = process.env;

  const isProduction = NODE_ENV === "production";
  const app = express();

  applySecurity(app, { clientOrigin: CLIENT_ORIGIN, isProduction });

  // The refresh token arrives as an httpOnly cookie.
  app.use(cookieParser());

  // Short-lived session, used ONLY to carry Passport's CSRF `state` across the
  // OAuth redirect. After login the app is stateless and uses the JWT.
  app.use(
    session({
      name: "zentro.sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction, // HTTPS-only in prod (needs trust proxy)
        sameSite: "lax", // must survive the provider's cross-site redirect
        maxAge: 10 * 60 * 1000,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // Mounted twice: "/health" for a direct hit on the port, "/api/*" because
  // Nginx and the ALB forward the /api prefix unchanged.
  app.get("/health", (_req, res) => res.json({ ok: true, pid: process.pid }));
  app.use("/api", apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
