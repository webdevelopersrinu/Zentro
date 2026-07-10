import mongoose from "mongoose";
import { Room } from "../models/Room.js";
import { Message } from "../models/Message.js";
import * as userService from "./user.service.js";
import { getOnlineUserIds } from "./presence.service.js";
import { notifyUser } from "../utils/notify.js";
import { AppError } from "../utils/AppError.js";
import {
  ROOM_VISIBILITY,
  SOCKET_EVENTS,
  MESSAGE_HISTORY_LIMIT,
} from "../constants/index.js";

// ── predicates & guards ────────────────────────────────────────────────────
const idEq = (a, b) => String(a) === String(b);
const contains = (list, id) => (list ?? []).some((x) => idEq(x, id));

export const isMember = (room, userId) => contains(room.members, userId);
export const isCreator = (room, userId) => idEq(room.creator, userId);
export const hasRequested = (room, userId) => contains(room.joinRequests, userId);

export function assertMember(room, userId) {
  if (!isMember(room, userId))
    throw AppError.forbidden("Not a member of this room");
}

export function assertCreator(room, userId, action = "manage") {
  if (!isCreator(room, userId))
    throw AppError.forbidden(`Only the creator can ${action} this room`);
}

// ── reads ──────────────────────────────────────────────────────────────────
export async function getRoomOrFail(roomId) {
  if (!mongoose.isValidObjectId(roomId)) throw AppError.notFound("Room not found");
  const room = await Room.findById(roomId);
  if (!room) throw AppError.notFound("Room not found");
  return room;
}

/** Rooms the user belongs to. */
export const listMyRooms = (userId) =>
  Room.find({ members: userId }).sort({ updatedAt: -1 });

/**
 * Rooms the user is NOT in. Private rooms are included on purpose: they are
 * visible-but-locked, so the UI can offer "Request to join".
 */
export const listDiscoverableRooms = (userId) =>
  Room.find({ members: { $ne: userId } }).sort({ updatedAt: -1 });

export async function listMessages(room, userId) {
  assertMember(room, userId);
  return Message.find({ room: room._id })
    .sort({ createdAt: 1 })
    .limit(MESSAGE_HISTORY_LIMIT);
}

export async function listMembers(room, userId) {
  assertMember(room, userId);
  const users = await userService.findByIds(room.members);
  const online = await getOnlineUserIds(room.members);
  return users.map((user) => ({ user, online: online.has(String(user._id)) }));
}

export async function listJoinRequests(room, userId) {
  assertCreator(room, userId, "view requests for");
  return userService.findByIds(room.joinRequests);
}

// ── writes ─────────────────────────────────────────────────────────────────
export const createRoom = ({ userId, name, visibility }) =>
  Room.create({
    name,
    visibility,
    creator: userId,
    members: [userId],
    joinRequests: [],
  });

/**
 * Public rooms admit anyone immediately. Private rooms record a request and
 * notify the creator; the caller does NOT become a member.
 */
export async function joinRoom(room, user) {
  if (isMember(room, user.id)) throw AppError.badRequest("Already a member");

  if (room.visibility === ROOM_VISIBILITY.PUBLIC) {
    room.members.push(user.id);
    await room.save();
    return { joined: true };
  }

  if (!hasRequested(room, user.id)) {
    room.joinRequests.push(user.id);
    await room.save();

    notifyUser(room.creator, SOCKET_EVENTS.REQUEST_NEW, {
      roomId: String(room._id),
      roomName: room.name,
      from: {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        avatarUrl: user.avatarUrl || "",
      },
    });
  }
  return { requested: true };
}

const removeRequest = (room, userId) => {
  room.joinRequests = room.joinRequests.filter((u) => !idEq(u, userId));
};

export async function approveRequest(room, actorId, targetUserId) {
  assertCreator(room, actorId, "approve requests for");
  if (!hasRequested(room, targetUserId))
    throw AppError.notFound("No such pending request");

  removeRequest(room, targetUserId);
  if (!isMember(room, targetUserId)) room.members.push(targetUserId);
  await room.save();

  notifyUser(targetUserId, SOCKET_EVENTS.REQUEST_APPROVED, {
    roomId: String(room._id),
    roomName: room.name,
  });
  return room;
}

export async function rejectRequest(room, actorId, targetUserId) {
  assertCreator(room, actorId, "reject requests for");
  if (!hasRequested(room, targetUserId))
    throw AppError.notFound("No such pending request");

  removeRequest(room, targetUserId);
  await room.save();

  notifyUser(targetUserId, SOCKET_EVENTS.REQUEST_REJECTED, {
    roomId: String(room._id),
    roomName: room.name,
  });
  return room;
}

/** The creator adds someone directly — no acceptance step. */
export async function inviteByUsername(room, actor, username) {
  assertCreator(room, actor.id, "invite to");

  const invitee = await userService.findByUsername(username);
  if (!invitee) throw AppError.notFound("User not found");

  if (!isMember(room, invitee._id)) {
    room.members.push(invitee._id);
    removeRequest(room, invitee._id); // a pending request is now moot
    await room.save();

    notifyUser(invitee._id, SOCKET_EVENTS.ROOM_INVITED, {
      roomId: String(room._id),
      roomName: room.name,
      from: actor.username,
    });
  }
  return room;
}

export async function leaveRoom(room, userId) {
  if (isCreator(room, userId))
    throw AppError.badRequest("The creator cannot leave; delete the room instead");
  assertMember(room, userId);

  room.members = room.members.filter((m) => !idEq(m, userId));
  await room.save();
}

export async function updateRoom(room, actorId, { name, visibility }) {
  assertCreator(room, actorId, "update");
  if (name !== undefined) room.name = name;
  if (visibility !== undefined) room.visibility = visibility;
  await room.save();
  return room;
}

export async function deleteRoom(room, actorId) {
  assertCreator(room, actorId, "delete");
  await Message.deleteMany({ room: room._id });
  await room.deleteOne();
  return String(room._id);
}
