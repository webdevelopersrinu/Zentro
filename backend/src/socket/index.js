import { verifyToken } from "../utils/token.js";
import { Room } from "../models/Room.js";
import { Message } from "../models/Message.js";

// Registers all real-time chat behaviour on the Socket.IO server.
// Thanks to the Valkey adapter, io.to(room).emit(...) reaches members on ALL
// servers, not just the one this socket happens to be connected to.
export function registerSocketHandlers(io) {
  // --- 1. Authenticate every socket using the JWT from the client handshake.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);
      socket.user = payload; // { id, username }
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { id: userId, username } = socket.user;
    console.log(`🔌 ${username} connected (${socket.id})`);

    // --- 2. Join a room (only if you're a member). Room id is used as the
    //        Socket.IO "room" key so broadcasts target the right people.
    socket.on("room:join", async (roomId, ack) => {
      try {
        const room = await Room.findById(roomId);
        const isMember =
          room && room.members.some((m) => m.toString() === userId);
        if (!isMember) return ack?.({ ok: false, error: "Not a member" });

        socket.join(roomId);
        // Let others in the room know someone joined.
        socket.to(roomId).emit("presence:joined", { username });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    // --- 3. Leave a room.
    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("presence:left", { username });
    });

    // --- 4. Send a message. Save to MongoDB, then broadcast to the whole room
    //        (across all servers via the Valkey adapter).
    socket.on("message:send", async ({ roomId, text }, ack) => {
      try {
        if (!text?.trim()) return ack?.({ ok: false, error: "Empty message" });

        const room = await Room.findById(roomId);
        const isMember =
          room && room.members.some((m) => m.toString() === userId);
        if (!isMember) return ack?.({ ok: false, error: "Not a member" });

        const msg = await Message.create({
          room: roomId,
          sender: userId,
          username,
          text: text.trim(),
        });

        const payload = {
          id: msg._id,
          roomId,
          username,
          text: msg.text,
          createdAt: msg.createdAt,
        };

        // Goes to everyone in the room — including users on the OTHER EC2.
        io.to(roomId).emit("message:new", payload);
        ack?.({ ok: true, message: payload });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    // --- 5. "typing..." indicator (not saved, just relayed live).
    socket.on("typing", ({ roomId, isTyping }) => {
      socket.to(roomId).emit("typing", { username, isTyping });
    });

    socket.on("disconnect", () => {
      console.log(`❌ ${username} disconnected`);
    });
  });
}
