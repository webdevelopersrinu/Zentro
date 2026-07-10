import { api } from "../lib/apiClient.js";

const rooms = "/rooms";
const room = (id) => `${rooms}/${id}`;

export const listMyRooms = () => api.get(rooms).then(({ data }) => data.rooms);

/** Rooms I'm not in. Private ones are included: visible, but locked. */
export const listDiscoverableRooms = () =>
  api.get(`${rooms}/discover`).then(({ data }) => data.rooms);

export const createRoom = (payload) =>
  api.post(rooms, payload).then(({ data }) => data.room);

/** Public → { joined: true }. Private → { requested: true }, no membership. */
export const joinRoom = (id) => api.post(`${room(id)}/join`).then(({ data }) => data);

export const leaveRoom = (id) => api.post(`${room(id)}/leave`);

export const listMessages = (id) =>
  api.get(`${room(id)}/messages`).then(({ data }) => data.messages);

export const listMembers = (id) =>
  api.get(`${room(id)}/members`).then(({ data }) => data.members);

export const listRequests = (id) =>
  api.get(`${room(id)}/requests`).then(({ data }) => data.requests);

export const approveRequest = (id, userId) =>
  api.post(`${room(id)}/requests/${userId}/approve`).then(({ data }) => data.room);

export const rejectRequest = (id, userId) =>
  api.post(`${room(id)}/requests/${userId}/reject`).then(({ data }) => data.room);

export const inviteUser = (id, username) =>
  api.post(`${room(id)}/invite`, { username }).then(({ data }) => data.room);
