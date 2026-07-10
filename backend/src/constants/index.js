export const ROOM_VISIBILITY = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

export const AUTH_PROVIDER = Object.freeze({
  GOOGLE: "google",
  GITHUB: "github",
});

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
});

/** Every event name used on the wire. Never type these as string literals. */
export const SOCKET_EVENTS = Object.freeze({
  // client → server
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  MESSAGE_SEND: "message:send",
  TYPING: "typing",

  // server → client
  READY: "ready", // server finished per-connection setup; safe to emit
  MESSAGE_NEW: "message:new",
  PRESENCE_JOINED: "presence:joined",
  PRESENCE_LEFT: "presence:left",
  REQUEST_NEW: "request:new",
  REQUEST_APPROVED: "request:approved",
  REQUEST_REJECTED: "request:rejected",
  ROOM_INVITED: "room:invited",
});

/**
 * Access tokens are short-lived and live in the client's MEMORY.
 * Refresh tokens are long-lived, opaque, stored server-side (revocable), and
 * travel only in an httpOnly cookie scoped to the auth routes.
 */
export const TOKEN = Object.freeze({
  ACCESS_TTL: "15m",
  REFRESH_TTL_SECONDS: 30 * 24 * 60 * 60, // 30 days
  /** Grace window in which a rotated token is retained purely to detect reuse. */
  REUSE_DETECTION_TTL_SECONDS: 30 * 24 * 60 * 60,
  COOKIE_NAME: "zentro_rt",
  COOKIE_PATH: "/api/auth",
});

export const MESSAGE_HISTORY_LIMIT = 100;
export const MESSAGE_MAX_LENGTH = 2000; // matches the Message schema
export const USER_SEARCH_LIMIT = 10;

/** Per-socket flood control for message:send. */
export const SOCKET_RATE_LIMIT = Object.freeze({
  WINDOW_MS: 10_000,
  MAX_EVENTS: 20,
});

/** Personal Socket.IO room; lets us push an event to one user, cluster-wide. */
export const userChannel = (userId) => `user:${userId}`;
