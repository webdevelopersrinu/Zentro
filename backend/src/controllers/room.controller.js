import { asyncHandler } from "../middleware/asyncHandler.js";
import * as roomService from "../services/room.service.js";
import {
  toRoomDTO,
  toMessageDTO,
  toMemberDTO,
  toUserDTO,
} from "../utils/serializers.js";
import { HTTP_STATUS } from "../constants/index.js";

const roomsFor = (rooms, viewerId) => rooms.map((r) => toRoomDTO(r, viewerId));

export const create = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom({ userId: req.user.id, ...req.body });
  res.status(HTTP_STATUS.CREATED).json({ room: toRoomDTO(room, req.user.id) });
});

export const listMine = asyncHandler(async (req, res) => {
  const rooms = await roomService.listMyRooms(req.user.id);
  res.json({ rooms: roomsFor(rooms, req.user.id) });
});

export const discover = asyncHandler(async (req, res) => {
  const rooms = await roomService.listDiscoverableRooms(req.user.id);
  res.json({ rooms: roomsFor(rooms, req.user.id) });
});

export const join = asyncHandler(async (req, res) => {
  const result = await roomService.joinRoom(req.room, req.user);
  res.json({ ...result, room: toRoomDTO(req.room, req.user.id) });
});

export const listRequests = asyncHandler(async (req, res) => {
  const users = await roomService.listJoinRequests(req.room, req.user.id);
  res.json({ requests: users.map(toUserDTO) });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const room = await roomService.approveRequest(
    req.room,
    req.user.id,
    req.params.userId
  );
  res.json({ ok: true, room: toRoomDTO(room, req.user.id) });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const room = await roomService.rejectRequest(
    req.room,
    req.user.id,
    req.params.userId
  );
  res.json({ ok: true, room: toRoomDTO(room, req.user.id) });
});

export const invite = asyncHandler(async (req, res) => {
  const room = await roomService.inviteByUsername(
    req.room,
    req.user,
    req.body.username
  );
  res.json({ room: toRoomDTO(room, req.user.id) });
});

export const leave = asyncHandler(async (req, res) => {
  await roomService.leaveRoom(req.room, req.user.id);
  res.json({ ok: true });
});

export const update = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(req.room, req.user.id, req.body);
  res.json({ room: toRoomDTO(room, req.user.id) });
});

export const remove = asyncHandler(async (req, res) => {
  const deletedRoomId = await roomService.deleteRoom(req.room, req.user.id);
  res.json({ ok: true, deletedRoomId });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await roomService.listMessages(req.room, req.user.id);
  res.json({ messages: messages.map(toMessageDTO) });
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await roomService.listMembers(req.room, req.user.id);
  res.json({
    members: members.map(({ user, online }) =>
      toMemberDTO(user, { room: req.room, online })
    ),
  });
});
