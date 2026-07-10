/**
 * Base URL of the backend API.
 *   dev:  http://localhost:4000/api   (frontend/.env → VITE_API_URL)
 *   prod: /api                        (same origin, proxied by Nginx)
 */
export const API_BASE = import.meta.env.VITE_API_URL || "/api";

/** Socket.IO connects to the server ORIGIN, not the /api path. */
export const SOCKET_URL =
  API_BASE.replace(/\/api\/?$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const ROOM_VISIBILITY = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
});

/** Mirrors backend/src/constants/index.js — keep the two in sync. */
export const SOCKET_EVENTS = Object.freeze({
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  MESSAGE_SEND: "message:send",
  TYPING: "typing",

  READY: "ready",
  MESSAGE_NEW: "message:new",
  PRESENCE_JOINED: "presence:joined",
  PRESENCE_LEFT: "presence:left",
  REQUEST_NEW: "request:new",
  REQUEST_APPROVED: "request:approved",
  REQUEST_REJECTED: "request:rejected",
  ROOM_INVITED: "room:invited",
});

export const THEME_STORAGE_KEY = "zentro_theme";
export const TYPING_THROTTLE_MS = 2000;
export const SEARCH_DEBOUNCE_MS = 300;
