import { userChannel } from "../constants/index.js";

/**
 * Wraps a socket handler whose last argument is an ack callback, turning
 * resolve/throw into { ok: true, ... } / { ok: false, error }. Keeps every
 * handler free of try/catch, mirroring asyncHandler on the HTTP side.
 */
export const withAck =
  (handler) =>
  async (...args) => {
    const ack = typeof args.at(-1) === "function" ? args.pop() : null;
    try {
      const result = await handler(...args);
      ack?.({ ok: true, ...result });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  };

/**
 * The chat rooms this socket is in — excluding its own socket id and its
 * personal `user:<id>` channel, which Socket.IO also reports as "rooms".
 */
export const chatRoomsOf = (socket) =>
  [...socket.rooms].filter(
    (r) => r !== socket.id && r !== userChannel(socket.user.id)
  );
