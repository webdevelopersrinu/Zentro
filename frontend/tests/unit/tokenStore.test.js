import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  onAccessTokenChange,
} from "../../src/lib/tokenStore.js";

beforeEach(() => clearAccessToken());

describe("tokenStore", () => {
  it("holds the token in memory", () => {
    setAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
  });

  it("NEVER writes the token to localStorage — that is the whole point", () => {
    setAccessToken("super-secret");

    const dump = JSON.stringify({ ...localStorage });
    expect(dump).not.toContain("super-secret");
    expect(localStorage.length).toBe(0);
  });

  it("normalises undefined to null", () => {
    setAccessToken(undefined);
    expect(getAccessToken()).toBeNull();
  });

  it("clears the token", () => {
    setAccessToken("abc");
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("notifies subscribers so the socket can reconnect with the new token", () => {
    const listener = vi.fn();
    const unsubscribe = onAccessTokenChange(listener);

    setAccessToken("first");
    setAccessToken("second");

    expect(listener).toHaveBeenNthCalledWith(1, "first");
    expect(listener).toHaveBeenNthCalledWith(2, "second");
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    onAccessTokenChange(listener)();

    setAccessToken("ignored");

    expect(listener).not.toHaveBeenCalled();
  });
});
