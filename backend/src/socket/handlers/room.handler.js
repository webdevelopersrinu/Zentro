import * as roomService from "../../services/room.service.js";
import { SOCKET_EVENTS } from "../../constants/index.js";
import { withAck, chatRoomsOf } from "../helpers.js";

/**
 * Every presence and typing payload carries its roomId. Without it a client in
 * two rooms cannot tell which one the event belongs to, and would flip the wrong
 * member's dot or show "alice is typing" in the wrong conversation.
 */
export function broadcastPresence(socket, event) {
  const { id: userId, username } = socket.user;
  chatRoomsOf(socket).forEach((roomId) =>
    socket.to(roomId).emit(event, { roomId, userId, username })
  );
}

export function registerRoomHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  /**
   * Subscribes this socket to a room's broadcasts. The server auto-joins the
   * rooms you belonged to at connect time; a room created or joined afterwards
   * needs this, or `io.to(roomId)` will never reach you.
   */
  socket.on(
    SOCKET_EVENTS.ROOM_JOIN,
    withAck(async (roomId) => {
      const room = await roomService.getRoomOrFail(roomId);
      roomService.assertMember(room, userId);

      socket.join(roomId);
      socket.to(roomId).emit(SOCKET_EVENTS.PRESENCE_JOINED, { roomId, userId, username });
    })
  );

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit(SOCKET_EVENTS.PRESENCE_LEFT, { roomId, userId, username });
  });

  socket.on(SOCKET_EVENTS.TYPING, ({ roomId, isTyping }) => {
    socket.to(roomId).emit(SOCKET_EVENTS.TYPING, { roomId, username, isTyping });
  });
}
