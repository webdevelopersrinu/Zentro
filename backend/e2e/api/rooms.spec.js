import { test, expect, request } from "@playwright/test";

import { E2E } from "../env.js";
import { fixtures, bearer } from "../helpers.js";

/**
 * The private-room approval journey, end to end, exactly as a client would
 * drive it — and with the crucial twist that each step is issued to a
 * DIFFERENT server. State must live in MongoDB, never in a process.
 */
test.describe("Room lifecycle across servers", () => {
  let users;
  let apiA;
  let apiB;

  test.beforeAll(async () => {
    users = fixtures().users;
    apiA = await request.newContext({ baseURL: E2E.SERVER_A });
    apiB = await request.newContext({ baseURL: E2E.SERVER_B });
  });

  test.afterAll(async () => {
    await apiA.dispose();
    await apiB.dispose();
  });

  test("security headers are present on a real response", async () => {
    const res = await apiA.get("/api/health");
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["strict-transport-security"]).toBeTruthy();
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["ratelimit-policy"]).toBeTruthy();
  });

  test("private room: request on A, approve on B, then chat", async () => {
    // 1. Alice creates a private room on server A.
    const created = await apiA.post("/api/rooms", {
      headers: bearer(users.alice.accessToken),
      data: { name: "boardroom", visibility: "private" },
    });
    expect(created.status()).toBe(201);
    const room = (await created.json()).room;
    expect(room.visibility).toBe("private");

    // 2. Bob discovers it from server B — visible, but locked.
    const discover = await apiB.get("/api/rooms/discover", {
      headers: bearer(users.bob.accessToken),
    });
    const found = (await discover.json()).rooms.find((r) => r.id === room.id);
    expect(found).toMatchObject({ isMember: false, hasRequested: false });

    // 3. Bob cannot read it.
    const blocked = await apiB.get(`/api/rooms/${room.id}/messages`, {
      headers: bearer(users.bob.accessToken),
    });
    expect(blocked.status()).toBe(403);

    // 4. Bob requests to join, via server B.
    const requested = await apiB.post(`/api/rooms/${room.id}/join`, {
      headers: bearer(users.bob.accessToken),
    });
    expect((await requested.json())).toMatchObject({ requested: true });

    // 5. Requesting granted nothing.
    const stillBlocked = await apiB.get(`/api/rooms/${room.id}/messages`, {
      headers: bearer(users.bob.accessToken),
    });
    expect(stillBlocked.status()).toBe(403);

    // 6. Alice sees the request on server A.
    const pending = await apiA.get(`/api/rooms/${room.id}/requests`, {
      headers: bearer(users.alice.accessToken),
    });
    expect((await pending.json()).requests[0].username).toBe("bob");

    // 7. Mallory may not approve.
    const forbidden = await apiA.post(
      `/api/rooms/${room.id}/requests/${users.bob.id}/approve`,
      { headers: bearer(users.mallory.accessToken) }
    );
    expect(forbidden.status()).toBe(403);

    // 8. Alice approves.
    const approved = await apiA.post(
      `/api/rooms/${room.id}/requests/${users.bob.id}/approve`,
      { headers: bearer(users.alice.accessToken) }
    );
    expect(approved.status()).toBe(200);

    // 9. Bob can now read, from server B.
    const allowed = await apiB.get(`/api/rooms/${room.id}/messages`, {
      headers: bearer(users.bob.accessToken),
    });
    expect(allowed.status()).toBe(200);
  });

  test("public room: join instantly from the other server", async () => {
    const created = await apiA.post("/api/rooms", {
      headers: bearer(users.alice.accessToken),
      data: { name: "town-hall", visibility: "public" },
    });
    const room = (await created.json()).room;

    const joined = await apiB.post(`/api/rooms/${room.id}/join`, {
      headers: bearer(users.mallory.accessToken),
    });

    expect(joined.status()).toBe(200);
    expect((await joined.json()).joined).toBe(true);
  });

  test("XSS payloads are stripped before storage", async () => {
    const res = await apiA.post("/api/rooms", {
      headers: bearer(users.alice.accessToken),
      data: { name: "<img src=x onerror=alert(1)>clean" },
    });

    expect((await res.json()).room.name).toBe("clean");
  });

  test("an oversized payload is rejected with 413", async () => {
    const res = await apiA.post("/api/rooms", {
      headers: bearer(users.alice.accessToken),
      data: { name: "x".repeat(20_000) },
    });

    expect(res.status()).toBe(413);
  });

  test("unauthenticated requests are rejected", async () => {
    const res = await apiA.get("/api/rooms");
    expect(res.status()).toBe(401);
  });
});
