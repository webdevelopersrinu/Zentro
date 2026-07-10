import { z } from "zod";
import { ROOM_VISIBILITY } from "../constants/index.js";
import { stripHtml } from "../utils/sanitize.js";

// Strip markup BEFORE length checks, so "<b></b>" can't pass as a name and
// so a 40-char limit can't be smuggled past with tags.
const roomName = z
  .string()
  .transform(stripHtml)
  .pipe(z.string().min(1, "Room name required").max(40));

const visibility = z.enum([ROOM_VISIBILITY.PUBLIC, ROOM_VISIBILITY.PRIVATE]);

export const createRoomSchema = z.object({
  name: roomName,
  visibility: visibility.default(ROOM_VISIBILITY.PUBLIC),
});

export const updateRoomSchema = z
  .object({ name: roomName.optional(), visibility: visibility.optional() })
  .refine((v) => v.name !== undefined || v.visibility !== undefined, {
    message: "Nothing to update",
  });

export const inviteSchema = z.object({
  username: z.string().trim().min(1, "username required").max(30),
});
