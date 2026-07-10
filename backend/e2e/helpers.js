import fs from "fs";
import { io as ioClient } from "socket.io-client";
import { E2E } from "./env.js";

export const fixtures = () => JSON.parse(fs.readFileSync(E2E.FIXTURES, "utf8"));

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

// ── cookies ────────────────────────────────────────────────────────────────

/** All Set-Cookie headers, since headers() collapses duplicates. */
export const setCookies = (response) =>
  response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);

export const refreshCookie = (response) => {
  const raw = setCookies(response).find((c) => c.startsWith("zentro_rt="));
  return raw?.split(";")[0].split("=")[1] || null;
};

export const cookieHeader = (token) => ({ Cookie: `zentro_rt=${token}` });

// ── sockets ────────────────────────────────────────────────────────────────

/**
 * Connects to a specific server and resolves on "ready" — the server emits it
 * after joining the socket to its rooms, so broadcasts cannot be missed.
 */
export function connectSocket(url, accessToken) {
  const socket = ioClient(url, {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: false,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`connect timeout: ${url}`)), 10_000);
    socket.once("ready", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function waitFor(socket, event, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for "${event}"`)),
      timeoutMs
    );
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

export const emitAck = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

export const closeAll = (...sockets) => sockets.forEach((s) => s?.disconnect());
