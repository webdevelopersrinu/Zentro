import { SOCKET_RATE_LIMIT } from "../constants/index.js";
import { AppError } from "../utils/AppError.js";

/**
 * Per-socket sliding-window limiter. HTTP rate limiting does nothing for an
 * open WebSocket, so message:send needs its own budget — otherwise one client
 * can flood every member of a room (and the database) at line rate.
 *
 * State lives on the socket, so it dies with the connection. Reconnecting to
 * reset the window costs a full handshake, which is the point.
 */
export function socketRateLimiter({
  windowMs = SOCKET_RATE_LIMIT.WINDOW_MS,
  max = SOCKET_RATE_LIMIT.MAX_EVENTS,
} = {}) {
  return (socket) => {
    const hits = [];

    return () => {
      const now = Date.now();
      while (hits.length && now - hits[0] > windowMs) hits.shift();

      if (hits.length >= max) {
        throw AppError.tooManyRequests("Slow down — too many messages");
      }
      hits.push(now);
    };
  };
}
