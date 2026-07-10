/**
 * The single source of truth for every shape the API returns.
 * Controllers never hand a Mongoose document to res.json().
 */
const idOf = (v) => (v?._id ?? v).toString();
const has = (list, id) => (list ?? []).some((x) => idOf(x) === id);

export const toUserDTO = (user) => ({
  id: idOf(user),
  username: user.username,
  name: user.name || user.username,
  avatarUrl: user.avatarUrl || "",
});

export const toMessageDTO = (message) => ({
  id: idOf(message),
  roomId: idOf(message.room),
  username: message.username,
  text: message.text,
  createdAt: message.createdAt,
});

/**
 * Room as seen *by a specific viewer*. The flags tell the UI which button to
 * render: Open / Join / Request to join / Requested.
 */
export const toRoomDTO = (room, viewerId) => {
  const viewer = String(viewerId);
  return {
    id: idOf(room),
    name: room.name,
    visibility: room.visibility,
    creator: idOf(room.creator),
    isCreator: idOf(room.creator) === viewer,
    isMember: has(room.members, viewer),
    hasRequested: has(room.joinRequests, viewer),
    memberCount: (room.members ?? []).length,
    requestCount: (room.joinRequests ?? []).length,
  };
};

export const toMemberDTO = (user, { room, online }) => ({
  ...toUserDTO(user),
  online,
  isCreator: idOf(room.creator) === idOf(user),
});
