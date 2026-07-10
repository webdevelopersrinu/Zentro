import { http, HttpResponse } from "msw";

import { API_BASE } from "../../src/config/index.js";

const url = (path) => `${API_BASE}${path}`;

export const testUser = {
  id: "u1",
  username: "alice",
  name: "Alice",
  avatarUrl: "https://cdn.test/alice.png",
};

/**
 * MSW intercepts at the network layer, so axios — and every interceptor on it —
 * runs for real. Mocking axios itself would skip the refresh/retry logic, which
 * is precisely the code most worth testing.
 */
export const handlers = [
  http.post(url("/auth/refresh"), () =>
    HttpResponse.json({ accessToken: "access-token-1", user: testUser })
  ),

  http.post(url("/auth/logout"), () => new HttpResponse(null, { status: 204 })),

  http.get(url("/auth/me"), () => HttpResponse.json({ user: testUser })),

  http.get(url("/rooms"), () => HttpResponse.json({ rooms: [] })),
];

/** Convenience builders for per-test overrides. */
export const unauthorized = (path) =>
  http.get(url(path), () => HttpResponse.json({ error: "Missing token" }, { status: 401 }));

export const refreshFails = () =>
  http.post(url("/auth/refresh"), () =>
    HttpResponse.json({ error: "Invalid refresh token" }, { status: 401 })
  );
