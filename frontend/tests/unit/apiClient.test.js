import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { api, onSessionExpired } from "../../src/lib/apiClient.js";
import { getAccessToken, setAccessToken, clearAccessToken } from "../../src/lib/tokenStore.js";
import { server } from "../msw/server.js";
import { API_BASE } from "../../src/config/index.js";
import { refreshFails } from "../msw/handlers.js";

const url = (path) => `${API_BASE}${path}`;

/** Fails with 401 the first N times, then succeeds. */
const flakyEndpoint = (path, failures = 1) => {
  let calls = 0;
  return http.get(url(path), ({ request }) => {
    calls += 1;
    if (calls <= failures) {
      return HttpResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return HttpResponse.json({
      ok: true,
      calls,
      auth: request.headers.get("authorization"),
    });
  });
};

beforeEach(() => clearAccessToken());

describe("request interceptor", () => {
  it("attaches the in-memory access token as a Bearer header", async () => {
    setAccessToken("token-abc");
    server.use(
      http.get(url("/rooms"), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get("authorization") })
      )
    );

    const { data } = await api.get("/rooms");

    expect(data.auth).toBe("Bearer token-abc");
  });

  it("sends no Authorization header when signed out", async () => {
    server.use(
      http.get(url("/rooms"), ({ request }) =>
        HttpResponse.json({ auth: request.headers.get("authorization") })
      )
    );

    const { data } = await api.get("/rooms");

    expect(data.auth).toBeNull();
  });
});

describe("401 → refresh → retry", () => {
  it("refreshes once and replays the original request", async () => {
    setAccessToken("expired");
    server.use(flakyEndpoint("/rooms"));

    const { data } = await api.get("/rooms");

    expect(data.ok).toBe(true);
    expect(data.calls).toBe(2); // failed once, retried once
    expect(data.auth).toBe("Bearer access-token-1"); // retried with the NEW token
    expect(getAccessToken()).toBe("access-token-1");
  });

  it("retries only once — a second 401 is surfaced, not looped", async () => {
    setAccessToken("expired");
    server.use(flakyEndpoint("/rooms", 99));

    await expect(api.get("/rooms")).rejects.toMatchObject({ status: 401 });
  });

  it("does not attempt a refresh for /auth/* endpoints", async () => {
    const refreshSpy = vi.fn();
    server.use(
      http.post(url("/auth/refresh"), () => {
        refreshSpy();
        return HttpResponse.json({ accessToken: "x", user: {} });
      }),
      http.get(url("/auth/me"), () =>
        HttpResponse.json({ error: "Missing token" }, { status: 401 })
      )
    );

    await expect(api.get("/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});

describe("single-flight refresh", () => {
  it("triggers ONE refresh for many concurrent 401s", async () => {
    setAccessToken("expired");
    let refreshCalls = 0;

    server.use(
      http.post(url("/auth/refresh"), async () => {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20)); // widen the race
        return HttpResponse.json({ accessToken: "fresh", user: {} });
      }),
      flakyEndpoint("/rooms"),
      flakyEndpoint("/users/search"),
      flakyEndpoint("/auth/whoami-not-auth-guarded")
    );

    const results = await Promise.all([
      api.get("/rooms"),
      api.get("/users/search"),
      api.get("/rooms"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
  });
});

describe("refresh failure", () => {
  it("clears the token and notifies the app once", async () => {
    setAccessToken("expired");
    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    server.use(refreshFails(), flakyEndpoint("/rooms", 99));

    await expect(api.get("/rooms")).rejects.toBeInstanceOf(Error);

    expect(getAccessToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});

describe("error normalisation", () => {
  it("surfaces the server's message, never an axios object", async () => {
    server.use(
      http.get(url("/rooms"), () =>
        HttpResponse.json({ error: "Not a member of this room" }, { status: 403 })
      )
    );

    await expect(api.get("/rooms")).rejects.toMatchObject({
      status: 403,
      message: "Not a member of this room",
    });
  });

  it("explains a network failure in human terms", async () => {
    server.use(http.get(url("/rooms"), () => HttpResponse.error()));

    await expect(api.get("/rooms")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("Network error"),
    });
  });
});
