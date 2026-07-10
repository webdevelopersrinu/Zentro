import { User } from "../models/User.js";
import { USER_SEARCH_LIMIT } from "../constants/index.js";

const PUBLIC_FIELDS = "username name avatarUrl";

export const findById = (id) => User.findById(id).select(PUBLIC_FIELDS);

export const findByIds = (ids) =>
  User.find({ _id: { $in: ids } }).select(PUBLIC_FIELDS);

export const findByUsername = (username) =>
  User.findOne({ username: String(username ?? "").toLowerCase() });

/** Live username search for the invite box, excluding the searcher. */
export const searchUsernames = (query, excludeUserId) =>
  User.find({
    username: { $regex: query, $options: "i" },
    _id: { $ne: excludeUserId },
  })
    .select(PUBLIC_FIELDS)
    .limit(USER_SEARCH_LIMIT);

export const existsWithUsername = (username) => User.exists({ username });

export const findByProvider = (provider, providerId) =>
  User.findOne({ provider, providerId });

export const createUser = (data) => User.create(data);
