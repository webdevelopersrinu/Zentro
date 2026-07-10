import axios from "axios";

import { API_BASE } from "../config/index.js";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore.js";

/**
 * The one axios instance. Nothing outside services/ should import axios.
 *
 * withCredentials lets the browser attach the httpOnly refresh cookie to
 * /auth/refresh. It is harmless elsewhere: the cookie is Path=/api/auth.
 */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

/**
 * A bare instance for the refresh call itself. If refresh went through `api`,
 * a failing refresh would return 401, trigger the interceptor, and refresh
 * again — forever.
 */
const refreshClient = axios.create({ baseURL: API_BASE, withCredentials: true });

const noop = () => {};
let sessionExpiredHandler = noop;

/** Registers the "refresh finally failed" handler. Returns an unsubscribe. */
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = noop;
  };
}

/**
 * Single-flight: ten requests failing with 401 at once must trigger ONE refresh.
 * The first caller starts it; the rest await the same promise.
 */
let refreshPromise = null;

function refreshAccessToken() {
  refreshPromise ??= refreshClient
    .post("/auth/refresh")
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return data;
    })
    .catch((error) => {
      clearAccessToken();
      sessionExpiredHandler();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** Exposed so AuthContext can perform the silent login on boot. */
export const requestRefresh = () => refreshAccessToken();

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Retry exactly once, and never for the auth endpoints themselves.
    const canRetry =
      response?.status === 401 &&
      config &&
      !config._retry &&
      !config.url?.includes("/auth/");

    if (!canRetry) throw normalizeError(error);

    config._retry = true;
    try {
      await refreshAccessToken();
      return api(config);
    } catch {
      throw normalizeError(error);
    }
  }
);

/** Components see { status, message, code } — never an axios error object. */
export function normalizeError(error) {
  if (axios.isCancel(error)) return Object.assign(error, { canceled: true });

  const status = error.response?.status ?? 0;
  const message =
    error.response?.data?.error ??
    (status === 0 ? "Network error — check your connection" : "Something went wrong");

  return Object.assign(new Error(message), { status, code: error.code });
}
