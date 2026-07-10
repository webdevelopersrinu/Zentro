/**
 * The access token lives in a module variable — never in localStorage.
 *
 * localStorage is readable by any script on the page, so one XSS (or one
 * compromised npm package) hands an attacker a working credential. Held in
 * memory it dies with the tab, and the only thing that survives a reload is the
 * httpOnly refresh cookie, which JavaScript cannot read at all.
 *
 * Subscribers exist so the socket can reconnect when the token is renewed.
 */
let accessToken = null;
const listeners = new Set();

export const getAccessToken = () => accessToken;

export function setAccessToken(token) {
  accessToken = token ?? null;
  listeners.forEach((listener) => listener(accessToken));
}

export const clearAccessToken = () => setAccessToken(null);

/** Returns an unsubscribe function. */
export function onAccessTokenChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
