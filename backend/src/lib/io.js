/**
 * Socket.IO instance registry.
 *
 * The HTTP layer needs to push real-time events (join requests, approvals),
 * but services shouldn't reach into Express (`req.app.get("io")`) to do it.
 * server.js registers the instance here once; anything can then ask for it.
 *
 * Returns null before registration (e.g. in unit tests) — callers must no-op.
 */
let io = null;

export const setIO = (instance) => {
  io = instance;
};

export const getIO = () => io;
