import { getIO } from "../lib/io.js";
import { userChannel } from "../constants/index.js";

/**
 * Push an event to one user, wherever they are connected.
 *
 * Each socket joins `user:<id>` on connect, so this reaches all of that user's
 * open tabs — and, via the Valkey adapter, reaches them even when they're
 * connected to a different server than the one running this code.
 */
export function notifyUser(userId, event, payload) {
  getIO()?.to(userChannel(userId)).emit(event, payload);
}

/** Broadcast to everyone currently in a room. */
export function notifyRoom(roomId, event, payload) {
  getIO()?.to(String(roomId)).emit(event, payload);
}
