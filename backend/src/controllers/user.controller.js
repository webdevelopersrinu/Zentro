import { asyncHandler } from "../middleware/asyncHandler.js";
import * as userService from "../services/user.service.js";
import { toUserDTO } from "../utils/serializers.js";

export const search = asyncHandler(async (req, res) => {
  const { q } = req.validatedQuery;
  if (!q) return res.json({ users: [] });

  const users = await userService.searchUsernames(q, req.user.id);
  res.json({ users: users.map(toUserDTO) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
