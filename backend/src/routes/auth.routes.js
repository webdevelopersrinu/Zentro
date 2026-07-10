import { Router } from "express";
import passport from "../config/passport.js";
import { requireAuth } from "../middleware/auth.js";
import { sameOriginOnly } from "../middleware/sameOrigin.js";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";
import { AUTH_PROVIDER } from "../constants/index.js";

const router = Router();

const SCOPES = {
  [AUTH_PROVIDER.GOOGLE]: ["profile", "email"],
  [AUTH_PROVIDER.GITHUB]: ["user:email"],
};

/**
 * Both providers follow the same shape, so register them from one loop:
 *   GET /:provider           → bounce to the provider
 *   GET /callback/:provider  → provider returns here; we set the refresh cookie
 */
for (const provider of Object.values(AUTH_PROVIDER)) {
  router.get(
    `/${provider}`,
    passport.authenticate(provider, { scope: SCOPES[provider] })
  );

  router.get(
    `/callback/${provider}`,
    passport.authenticate(provider, {
      session: false,
      failureRedirect: "/api/auth/failure",
    }),
    authController.oauthSuccess
  );
}

router.get("/failure", authController.oauthFailure);

// Cookie-authenticated and state-changing: guard against CSRF.
router.post("/refresh", sameOriginOnly, authController.refresh);
router.post("/logout", sameOriginOnly, authController.logout);

router.get("/me", requireAuth, userController.me);

export default router;
