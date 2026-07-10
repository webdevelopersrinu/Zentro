import * as messageService from "../../services/message.service.js";
import { toMessageDTO } from "../../utils/serializers.js";
import { SOCKET_EVENTS } from "../../constants/index.js";
import { withAck } from "../helpers.js";
import { socketRateLimiter } from "../rateLimit.js";

const createLimiter = socketRateLimiter();

export function registerMessageHandlers(io, socket) {
  const { id: userId, username } = socket.user;
  const consumeBudget = createLimiter(socket);

  socket.on(
    SOCKET_EVENTS.MESSAGE_SEND,
    withAck(async ({ roomId, text }) => {
      consumeBudget(); // throws once the per-socket window is exhausted

      const message = await messageService.createMessage({
        roomId,
        sender: userId,
        username,
        text,
      });
      const dto = toMessageDTO(message);

      // io (not socket) so the sender's other tabs get it too. The Valkey
      // adapter carries this to members connected to the other servers.
      io.to(roomId).emit(SOCKET_EVENTS.MESSAGE_NEW, dto);
      return { message: dto };
    })
  );
}
