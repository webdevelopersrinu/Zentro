import { authenticateSocket } from "./authenticate.js";
import { registerRoomHandlers, broadcastPresence } from "./handlers/room.handler.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";
import * as roomService from "../services/room.service.js";
import { SOCKET_EVENTS, userChannel } from "../constants/index.js";
import { logger } from "../lib/logger.js";

/**
 * Auto-join every room the user belongs to, so they receive `message:new` for
 * rooms they aren't currently looking at — that's what drives unread badges.
 */
async function joinOwnRooms(socket, userId) {
  const rooms = await roomService.listMyRooms(userId);
  rooms.forEach((room) => socket.join(String(room._id)));
}

function onConnection(io, socket) {
  const { id: userId, username } = socket.user;
  logger.info(`🔌 ${username} connected (${socket.id})`);

  // Register listeners SYNCHRONOUSLY, before any await. A client may emit the
  // instant it sees "connect"; if we awaited first, that event would arrive
  // with no listener attached and its ack would never fire.
  socket.join(userChannel(userId)); // personal channel for targeted notifications
  registerRoomHandlers(io, socket);
  registerMessageHandlers(io, socket);

  // "disconnecting", not "disconnect": by the latter Socket.IO has already
  // emptied socket.rooms, so there would be nobody left to notify.
  socket.on("disconnecting", () =>
    broadcastPresence(socket, SOCKET_EVENTS.PRESENCE_LEFT)
  );
  socket.on("disconnect", () => logger.info(`❌ ${username} disconnected`));

  // Async setup. Clients that care about receiving broadcasts should wait for
  // "ready" — until the room joins land, this socket isn't subscribed yet.
  joinOwnRooms(socket, userId)
    .then(() => broadcastPresence(socket, SOCKET_EVENTS.PRESENCE_JOINED))
    .catch((err) => logger.error("auto-join failed:", err.message))
    .finally(() => socket.emit(SOCKET_EVENTS.READY));
}

export function registerSocketHandlers(io) {
  io.use(authenticateSocket);
  io.on("connection", (socket) => onConnection(io, socket));
}
