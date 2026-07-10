import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

import { findOrCreateSocialUser } from "../services/auth.service.js";
import * as userService from "../services/user.service.js";
import { AUTH_PROVIDER } from "../constants/index.js";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  SERVER_URL = "http://localhost:4000",
} = process.env;

const callbackURL = (provider) => `${SERVER_URL}/api/auth/callback/${provider}`;

/** Both providers expose the same fields under different shapes. */
const profileToUser = (provider) => (profile) => ({
  provider,
  providerId: profile.id,
  name: profile.displayName || profile.username,
  email: profile.emails?.[0]?.value,
  avatarUrl: profile.photos?.[0]?.value,
});

/** Passport's verify callback, identical for every OAuth2 strategy. */
const verify = (provider) => async (_accessToken, _refreshToken, profile, done) => {
  try {
    done(null, await findOrCreateSocialUser(profileToUser(provider)(profile)));
  } catch (err) {
    done(err);
  }
};

const STRATEGIES = [
  {
    provider: AUTH_PROVIDER.GOOGLE,
    Strategy: GoogleStrategy,
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
  },
  {
    provider: AUTH_PROVIDER.GITHUB,
    Strategy: GitHubStrategy,
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    options: { scope: ["user:email"] },
  },
];

// A strategy is only registered when its credentials are present. Missing
// credentials therefore surface as "Unknown authentication strategy" — which is
// why config/env.js must be the first import in server.js.
for (const { provider, Strategy, clientID, clientSecret, options } of STRATEGIES) {
  if (!clientID || !clientSecret) continue;
  passport.use(
    new Strategy(
      { clientID, clientSecret, callbackURL: callbackURL(provider), ...options },
      verify(provider)
    )
  );
}

// Used only for the session that survives the OAuth redirect; afterwards the
// app is stateless and authenticates with the JWT.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await userService.findById(id));
  } catch (err) {
    done(err);
  }
});

export default passport;
