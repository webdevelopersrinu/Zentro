import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider, useAuth } from "../../src/context/AuthContext.jsx";
import { server } from "../msw/server.js";
import { refreshFails } from "../msw/handlers.js";
import { getAccessToken, clearAccessToken } from "../../src/lib/tokenStore.js";

function Probe() {
  const { status, user, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.username ?? "-"}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

const status = () => screen.getByTestId("status").textContent;

beforeEach(() => clearAccessToken());

describe("AuthProvider — silent login", () => {
  it("starts in a loading state, so no screen flashes", () => {
    renderAuth();
    expect(status()).toBe("loading");
  });

  it("signs the user in from the refresh cookie alone", async () => {
    renderAuth();

    await waitFor(() => expect(status()).toBe("authenticated"));
    expect(screen.getByTestId("user")).toHaveTextContent("alice");
    expect(getAccessToken()).toBe("access-token-1");
  });

  it("falls back to anonymous when there is no valid cookie", async () => {
    server.use(refreshFails());
    renderAuth();

    await waitFor(() => expect(status()).toBe("anonymous"));
    expect(getAccessToken()).toBeNull();
  });
});

describe("AuthProvider — sign out", () => {
  it("clears the session and the in-memory token", async () => {
    renderAuth();
    await waitFor(() => expect(status()).toBe("authenticated"));

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(status()).toBe("anonymous"));
    expect(getAccessToken()).toBeNull();
  });

  it("signs out locally even if the server call fails", async () => {
    renderAuth();
    await waitFor(() => expect(status()).toBe("authenticated"));

    server.use(refreshFails());
    const { http, HttpResponse } = await import("msw");
    const { API_BASE } = await import("../../src/config/index.js");
    server.use(
      http.post(`${API_BASE}/auth/logout`, () => HttpResponse.error())
    );

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(status()).toBe("anonymous"));
  });
});

describe("useAuth", () => {
  it("refuses to be used outside its provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/within an AuthProvider/);

    consoleError.mockRestore();
  });
});
