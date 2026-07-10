import request from "supertest";
import jwt from "jsonwebtoken";

import { app, connectTestDB, resetTestDB, disconnectTestDB } from "../helpers/setup.js";
import { createUser, apiClient, anonymous } from "../helpers/factories.js";
import {
  issueRefreshToken,
  signAccessToken,
} from "../../src/services/token.service.js";
import { setTokenStore, MongoTokenStore } from "../../src/lib/tokenStore.js";
import { TOKEN } from "../../src/constants/index.js";
import { User } from "../../src/models/User.js";
import { RefreshToken } from "../../src/models/RefreshToken.js";

/** Pull the refresh token out of a Set-Cookie header. */
const cookieValue = (res) => {
  const raw = res.headers["set-cookie"]?.find((c) =>
    c.startsWith(`${TOKEN.COOKIE_NAME}=`)
  );
  return raw?.split(";")[0].split("=")[1] || null;
};

const cookieHeader = (token) => `${TOKEN.COOKIE_NAME}=${token}`;

/**
 * Browsers always attach an Origin header to a POST, and the sameOriginOnly
 * CSRF guard depends on it. The tests must therefore behave like a browser,
 * otherwise every request is rejected as cross-origin and we end up testing
 * the guard instead of the flow it protects.
 */
const ORIGIN = process.env.CLIENT_ORIGIN;

const post = (path, token) => {
  const req = request(app).post(path).set("Origin", ORIGIN);
  return token ? req.set("Cookie", cookieHeader(token)) : req;
};

const postRefresh = (token) => post("/api/auth/refresh", token);
const postLogout = (token) => post("/api/auth/logout", token);

describe("Auth: access + refresh tokens", () => {
  let user;

  beforeAll(connectTestDB);
  afterAll(disconnectTestDB);

  beforeEach(async () => {
    await resetTestDB();
    setTokenStore(new MongoTokenStore()); // the real production store
    ({ user } = await createUser({ username: "alice" }));
  });

  describe("Access token", () => {
    it("is short-lived, not a 7-day credential", () => {
      const { iat, exp } = jwt.decode(signAccessToken(user));
      const minutes = (exp - iat) / 60;

      expect(minutes).toBe(15);
    });

    it("carries the profile but never the email or provider id", () => {
      const payload = jwt.decode(signAccessToken(user));

      expect(payload).toMatchObject({
        id: user._id.toString(),
        username: "alice",
      });
      expect(payload).not.toHaveProperty("email");
      expect(payload).not.toHaveProperty("providerId");
    });

    it("is rejected once expired", async () => {
      const expired = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: "-1s",
      });

      const res = await apiClient(expired).get("/api/rooms");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("exchanges the cookie for an access token and the user", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await postRefresh(rt);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({ username: "alice" });
      expect(jwt.decode(res.body.accessToken).id).toBe(user._id.toString());
    });

    it("returns an access token that actually works", async () => {
      const rt = await issueRefreshToken(user._id);
      const { body } = await postRefresh(rt);

      const res = await apiClient(body.accessToken).get("/api/rooms");
      expect(res.status).toBe(200);
    });

    it("rotates the refresh token: a new one is set, the old stops working", async () => {
      const first = await issueRefreshToken(user._id);

      const res = await postRefresh(first);
      const second = cookieValue(res);

      expect(second).toBeTruthy();
      expect(second).not.toBe(first);

      // The rotated-away token must no longer be usable.
      await expect(postRefresh(first)).resolves.toMatchObject({ status: 401 });
    });

    it("sets the cookie httpOnly and path-scoped to /api/auth", async () => {
      const rt = await issueRefreshToken(user._id);
      const res = await postRefresh(rt);

      const raw = res.headers["set-cookie"].find((c) =>
        c.startsWith(TOKEN.COOKIE_NAME)
      );
      expect(raw).toMatch(/HttpOnly/i);
      expect(raw).toMatch(/Path=\/api\/auth/i);
      expect(raw).toMatch(/SameSite=Lax/i);
    });

    it("rejects a missing cookie", async () => {
      const res = await postRefresh(null);
      expect(res.status).toBe(401);
    });

    it("rejects an unknown token", async () => {
      const res = await postRefresh("deadbeef");
      expect(res.status).toBe(401);
    });

    it("401s if the account was deleted after the token was issued", async () => {
      const rt = await issueRefreshToken(user._id);
      await User.deleteOne({ _id: user._id });

      const res = await postRefresh(rt);
      expect(res.status).toBe(401);
    });
  });

  describe("Reuse detection (stolen refresh token)", () => {
    it("revokes the whole family when a rotated token is replayed", async () => {
      const first = await issueRefreshToken(user._id);

      // Legitimate user refreshes → first is rotated away, second issued.
      const second = cookieValue(await postRefresh(first));
      expect(second).toBeTruthy();

      // Attacker replays the stolen, already-rotated token.
      const replay = await postRefresh(first);
      expect(replay.status).toBe(401);
      expect(replay.body.error).toMatch(/reuse detected/i);

      // Consequence: the legitimate token is dead too. Both must re-login.
      const victim = await postRefresh(second);
      expect(victim.status).toBe(401);
    });

    it("keeps unrelated logins (other families) alive", async () => {
      const laptop = await issueRefreshToken(user._id); // login #1
      const phone = await issueRefreshToken(user._id); // login #2, new family

      const laptop2 = cookieValue(await postRefresh(laptop));
      await postRefresh(laptop); // replay → nukes the laptop family

      await expect(postRefresh(laptop2)).resolves.toMatchObject({ status: 401 });
      await expect(postRefresh(phone)).resolves.toMatchObject({ status: 200 });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("revokes the refresh token and clears the cookie", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await postLogout(rt);
      expect(res.status).toBe(204);

      const cleared = res.headers["set-cookie"].find((c) =>
        c.startsWith(TOKEN.COOKIE_NAME)
      );
      expect(cleared).toMatch(/zentro_rt=;/);

      await expect(postRefresh(rt)).resolves.toMatchObject({ status: 401 });
    });

    it("logs out every device from that login (whole family)", async () => {
      const original = await issueRefreshToken(user._id);
      const rotated = cookieValue(await postRefresh(original));

      await postLogout(rotated);

      await expect(postRefresh(rotated)).resolves.toMatchObject({ status: 401 });
    });

    it("is idempotent with no cookie", async () => {
      const res = await postLogout(null);
      expect(res.status).toBe(204);
    });
  });

  describe("CSRF guard (sameOriginOnly)", () => {
    // The refresh cookie is sent by the browser automatically, so a POST from
    // any other site would otherwise mint an access token for the attacker.
    it("rejects a request from a foreign origin", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Origin", "https://evil.example.com")
        .set("Cookie", cookieHeader(rt));

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/cross-origin/i);
    });

    it("rejects a request with no Origin header at all", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", cookieHeader(rt));

      expect(res.status).toBe(403);
    });

    it("guards logout too", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Origin", "https://evil.example.com")
        .set("Cookie", cookieHeader(rt));

      expect(res.status).toBe(403);
    });

    it("does not block the token from still being valid afterwards", async () => {
      const rt = await issueRefreshToken(user._id);

      await request(app)
        .post("/api/auth/refresh")
        .set("Origin", "https://evil.example.com")
        .set("Cookie", cookieHeader(rt));

      // A blocked CSRF attempt must not rotate or consume the victim's token.
      await expect(postRefresh(rt)).resolves.toMatchObject({ status: 200 });
    });
  });

  describe("Persistence (MongoTokenStore)", () => {
    it("stores a SHA-256 hash, never the token itself", async () => {
      const rt = await issueRefreshToken(user._id);

      const stored = await RefreshToken.findOne({ userId: user._id.toString() });
      expect(stored.tokenHash).toHaveLength(64);
      expect(stored.tokenHash).not.toBe(rt);
      await expect(RefreshToken.findOne({ tokenHash: rt })).resolves.toBeNull();
    });

    it("has a TTL index so expired tokens are reaped automatically", async () => {
      const indexes = await RefreshToken.collection.indexes();
      const ttl = indexes.find((i) => i.expireAfterSeconds !== undefined);

      expect(ttl).toBeDefined();
      expect(ttl.key).toEqual({ expiresAt: 1 });
      expect(ttl.expireAfterSeconds).toBe(0);
    });

    it("sets a 30-day expiry", async () => {
      await issueRefreshToken(user._id);
      const { expiresAt } = await RefreshToken.findOne({});

      const days = (expiresAt - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(29.9);
      expect(days).toBeLessThan(30.1);
    });

    it("keeps a rotated token (used: true) — that is what enables reuse detection", async () => {
      const first = await issueRefreshToken(user._id);
      await postRefresh(first);

      const docs = await RefreshToken.find({}).sort({ createdAt: 1 });
      expect(docs).toHaveLength(2);
      expect(docs[0].used).toBe(true);
      expect(docs[1].used).toBe(false);
      expect(docs[0].family).toBe(docs[1].family); // same chain
    });

    it("deletes the whole family on logout", async () => {
      const first = await issueRefreshToken(user._id);
      const rotated = cookieValue(await postRefresh(first));

      await postLogout(rotated);

      await expect(RefreshToken.countDocuments()).resolves.toBe(0);
    });

    it("records an audit trail for a 'your devices' screen", async () => {
      const first = await issueRefreshToken(user._id);
      await postRefresh(first).set("User-Agent", "Zentro-Test/1.0");

      const rotated = await RefreshToken.findOne({ used: false });
      expect(rotated.userAgent).toBe("Zentro-Test/1.0");
      expect(rotated.ip).toEqual(expect.any(String));
      expect(rotated.createdAt).toEqual(expect.any(Date));
    });

    it("treats an expired-but-unreaped document as invalid", async () => {
      const rt = await issueRefreshToken(user._id);
      // The TTL reaper runs ~every 60s; the store must not trust its timing.
      await RefreshToken.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

      const res = await postRefresh(rt);
      expect(res.status).toBe(401);
    });
  });

  describe("Token delivery", () => {
    it("never exposes a token in a URL", async () => {
      // The OAuth callback redirects to CLIENT_URL/auth/success with no query.
      const res = await anonymous().get("/api/auth/failure");
      expect(res.headers.location).not.toMatch(/token=/);
    });

    it("does not accept the refresh token as a bearer credential", async () => {
      const rt = await issueRefreshToken(user._id);

      const res = await apiClient(rt).get("/api/rooms");
      expect(res.status).toBe(401);
    });
  });
});
