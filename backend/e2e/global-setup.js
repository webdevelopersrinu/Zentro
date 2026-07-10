import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";

import { E2E } from "./env.js";

/**
 * Seeds the E2E database and mints the credentials the specs use.
 *
 * We cannot drive Google's consent screen from a test, so we do exactly what
 * the OAuth callback does after Passport succeeds: create the user, then issue
 * a refresh token into the REAL Valkey store. Everything after that point —
 * cookies, rotation, access tokens — is exercised over real HTTP.
 */
export default async function globalSetup() {
  // Env must be set before importing anything that reads process.env at import.
  process.env.JWT_SECRET = E2E.JWT_SECRET;
  process.env.MONGO_URI = E2E.MONGO_URI;
  process.env.VALKEY_URL = E2E.VALKEY_URL;
  process.env.NODE_ENV = "development";

  const { User } = await import("../src/models/User.js");
  const { setTokenStore, MongoTokenStore } = await import("../src/lib/tokenStore.js");
  const { issueRefreshToken, signAccessToken } = await import(
    "../src/services/token.service.js"
  );

  await mongoose.connect(E2E.MONGO_URI);
  await mongoose.connection.dropDatabase();

  setTokenStore(new MongoTokenStore());

  const make = async (username) => {
    const user = await User.create({
      provider: "google",
      providerId: `e2e-${username}`,
      username,
      name: username.toUpperCase(),
      email: `${username}@e2e.test`,
    });
    return {
      id: user._id.toString(),
      username,
      accessToken: signAccessToken(user),
      refreshToken: await issueRefreshToken(user._id),
    };
  };

  const users = {
    alice: await make("alice"),
    bob: await make("bob"),
    mallory: await make("mallory"),
  };

  await fs.mkdir(path.dirname(E2E.FIXTURES), { recursive: true });
  await fs.writeFile(E2E.FIXTURES, JSON.stringify({ users }, null, 2));

  await mongoose.disconnect();
}
