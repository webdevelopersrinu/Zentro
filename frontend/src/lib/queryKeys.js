/**
 * Every cache key in one place. Hand-written strings scattered through hooks are
 * how invalidation silently stops working.
 */
export const queryKeys = {
  rooms: ["rooms"],
  discover: ["rooms", "discover"],
  messages: (roomId) => ["rooms", roomId, "messages"],
  members: (roomId) => ["rooms", roomId, "members"],
  requests: (roomId) => ["rooms", roomId, "requests"],
  userSearch: (query) => ["users", "search", query],
};
