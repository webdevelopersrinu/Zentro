import { getIO } from "../lib/io.js";
import { userChannel } from "../constants/index.js";

/**
 * Who, among these users, currently has at least one socket open?
 *
 * Each socket joins its own `user:<id>` channel, so a non-empty channel means
 * the user is online. `fetchSockets()` queries the whole cluster through the
 * Valkey adapter, so this is correct across all servers — not just this one.
 *
 * Returns a Set of user ids. Empty when no socket server is running (tests).
 */
export async function getOnlineUserIds(userIds) {
  const io = getIO();
  if (!io) return new Set();

  const results = await Promise.all(
    userIds.map(async (id) => {
      const sockets = await io.in(userChannel(id)).fetchSockets();
      return sockets.length > 0 ? String(id) : null;
    })
  );
  return new Set(results.filter(Boolean));
}
