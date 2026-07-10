import { Message } from "../models/Message.js";
import { AppError } from "../utils/AppError.js";
import { stripHtml } from "../utils/sanitize.js";
import * as roomService from "./room.service.js";
import { MESSAGE_MAX_LENGTH } from "../constants/index.js";

/**
 * Persist a message after re-checking membership server-side. The socket layer
 * never trusts the client's claim that it belongs to a room, and never trusts
 * the text: markup is stripped before it is stored.
 */
export async function createMessage({ roomId, sender, username, text }) {
  const body = stripHtml(text);
  if (!body) throw AppError.badRequest("Empty message");
  if (body.length > MESSAGE_MAX_LENGTH)
    throw AppError.badRequest(`Message exceeds ${MESSAGE_MAX_LENGTH} characters`);

  const room = await roomService.getRoomOrFail(roomId);
  roomService.assertMember(room, sender);

  return Message.create({ room: room._id, sender, username, text: body });
}
