import { asyncHandler } from "./asyncHandler.js";
import * as roomService from "../services/room.service.js";

/**
 * Resolves :id into req.room, 404ing on a missing or malformed id.
 * Every /rooms/:id route mounts this, so controllers can assume req.room exists.
 */
export const loadRoom = asyncHandler(async (req, _res, next) => {
  req.room = await roomService.getRoomOrFail(req.params.id);
  next();
});
