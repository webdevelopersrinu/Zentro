import { io } from "socket.io-client";

import { SOCKET_URL } from "../config/index.js";

/**
 * Creates a socket authenticated with the CURRENT access token.
 *
 * The token is passed in the handshake, so a socket outlives its 15-minute
 * token — the connection was authorised when it was made, and the server
 * re-checks room membership on every message anyway. When the token rotates we
 * rebuild the socket so a future reconnect presents a valid one.
 */
export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    autoConnect: true,
  });
}
