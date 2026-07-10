import { test, expect, request } from "@playwright/test";

import { E2E } from "../env.js";
import { fixtures, bearer, refreshCookie, setCookies, cookieHeader } from "../helpers.js";

/**
 * The refresh flow over real HTTP against real Valkey. The Jest integration
 * suite covers the same logic with an in-memory store; this proves the wiring:
 * cookie attributes as the browser will see them, and rotation state that is
 * genuinely shared between the two server processes.
 */
test.describe("Auth: access + refresh over real HTTP", () => {
  let users;
  let api;

  test.beforeAll(async () => {
    users = fixtures().users;
    // Origin header set globally so the sameOriginOnly CSRF guard is satisfied.
    api = await request.newContext({ baseURL: E2E.SERVER_A });
  });

  test.afterAll(async () => await api.dispose());

  const postRefresh = (token, headers = {}) =>
    api.post("/api/auth/refresh", {
      headers: { ...(token ? cookieHeader(token) : {}), ...headers },
    });

  test("OAuth entrypoints redirect to the provider, not 500", async () => {
    const ctx = await request.newContext({ baseURL: E2E.SERVER_A });

    for (const [provider, host] of [
      ["google", "accounts.google.com"],
      ["github", "github.com"],
    ]) {
      const res = await ctx.get(`/api/auth/${provider}`, { maxRedirects: 0 });

      expect(res.status()).toBe(302);
      expect(res.headers().location).toContain(host);
      // The redirect must ask for OUR callback, never leak a token.
      expect(res.headers().location).toContain("redirect_uri");
      expect(res.headers().location).not.toMatch(/[?&]token=/);
    }
    await ctx.dispose();
  });

  test("refresh exchanges the cookie for a working access token", async () => {
    const res = await postRefresh(users.alice.refreshToken);
    expect(res.status()).toBe(200);

    const { accessToken, user } = await res.json();
    expect(user.username).toBe("alice");

    const rooms = await api.get("/api/rooms", { headers: bearer(accessToken) });
    expect(rooms.status()).toBe(200);
  });

  test("the cookie the browser receives is httpOnly, Lax and path-scoped", async () => {
    const res = await postRefresh(users.bob.refreshToken);
    const raw = setCookies(res).find((c) => c.startsWith("zentro_rt="));

    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    expect(raw).toMatch(/Path=\/api\/auth/i);
    // Not Secure here only because E2E runs over http; production sets it.
  });

  test("rotation: the old refresh token stops working", async () => {
    const first = users.mallory.refreshToken;

    const rotated = refreshCookie(await postRefresh(first));
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(first);

    const replay = await postRefresh(first);
    expect(replay.status()).toBe(401);
  });

  test("reuse detection revokes the family, across BOTH servers", async () => {
    // Fresh login chain for this test.
    const login = await postRefresh(refreshCookie(await postRefresh(users.alice.refreshToken)));
    const current = refreshCookie(login);
    const stale = refreshCookie(await postRefresh(current));

    // Replay the token that `stale` replaced → reuse detected.
    await postRefresh(current);

    // The victim's live token is dead too — and dead on the OTHER server,
    // because the store is Valkey, not process memory.
    const apiB = await request.newContext({ baseURL: E2E.SERVER_B });
    const onB = await apiB.post("/api/auth/refresh", {
      headers: { ...cookieHeader(stale), Origin: E2E.CLIENT_ORIGIN },
    });

    expect(onB.status()).toBe(401);
    await apiB.dispose();
  });

  test("logout revokes the token", async () => {
    const ctx = await request.newContext({ baseURL: E2E.SERVER_A });
    const issued = refreshCookie(
      await ctx.post("/api/auth/refresh", {
        headers: { ...cookieHeader(users.bob.refreshToken), Origin: E2E.CLIENT_ORIGIN },
      })
    );

    const out = await ctx.post("/api/auth/logout", {
      headers: { ...cookieHeader(issued), Origin: E2E.CLIENT_ORIGIN },
    });
    expect(out.status()).toBe(204);

    const after = await ctx.post("/api/auth/refresh", {
      headers: { ...cookieHeader(issued), Origin: E2E.CLIENT_ORIGIN },
    });
    expect(after.status()).toBe(401);
    await ctx.dispose();
  });

  test("CSRF: refresh is rejected from a foreign origin", async () => {
    const res = await postRefresh(users.alice.refreshToken, {
      Origin: "https://evil.example.com",
    });

    expect(res.status()).toBe(403);
  });

  test("a refresh token is not accepted as a bearer credential", async () => {
    const res = await api.get("/api/rooms", { headers: bearer(users.alice.refreshToken) });
    expect(res.status()).toBe(401);
  });

  test("a socket cannot connect without a valid access token", async () => {
    const { io } = await import("socket.io-client");
    const socket = io(E2E.SERVER_A, {
      auth: { token: "garbage" },
      transports: ["websocket"],
      reconnection: false,
    });

    const error = await new Promise((resolve) => socket.once("connect_error", resolve));
    expect(error.message).toBe("Unauthorized");
    socket.disconnect();
  });
});
