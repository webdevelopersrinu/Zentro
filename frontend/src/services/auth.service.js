import { api, requestRefresh } from "../lib/apiClient.js";
import { API_BASE } from "../config/index.js";
import { clearAccessToken } from "../lib/tokenStore.js";

/**
 * Social login is a full-page navigation, not an XHR: the browser must follow
 * the provider's redirects and receive the Set-Cookie from our callback.
 */
export const loginUrl = (provider) => `${API_BASE}/auth/${provider}`;

export const startLogin = (provider) => {
  window.location.href = loginUrl(provider);
};

/**
 * Silent login. The httpOnly refresh cookie is sent automatically; we get back
 * a short-lived access token and the current user.
 */
export const refreshSession = () => requestRefresh();

export const getMe = () => api.get("/auth/me").then(({ data }) => data.user);

/** Revokes the whole token family server-side, then drops the in-memory token. */
export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAccessToken();
  }
}
