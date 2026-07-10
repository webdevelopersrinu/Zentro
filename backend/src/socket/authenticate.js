import { verifyAccessToken } from "../services/token.service.js";

/**
 * io.use() guard. The client connects with io(url, { auth: { token } }) using
 * its short-lived ACCESS token — the same one the HTTP API accepts.
 *
 * The handshake is checked once; an established socket outlives the token's
 * 15-minute window. That's deliberate: the connection was authorised when it
 * was made, and every message re-checks room membership server-side anyway.
 * On reconnect the client presents a freshly refreshed token.
 */
export function authenticateSocket(socket, next) {
  try {
    socket.user = verifyAccessToken(socket.handshake.auth?.token);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}
