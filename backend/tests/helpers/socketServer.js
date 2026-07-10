import http from "http";
import { Server } from "socket.io";
import { io as ioClient } from "socket.io-client";

import { app } from "./setup.js";
import { registerSocketHandlers } from "../../src/socket/index.js";
import { setIO } from "../../src/lib/io.js";
import { SOCKET_EVENTS } from "../../src/constants/index.js";

/**
 * A real Socket.IO server on an ephemeral port, wired to the same handlers
 * production uses. No Valkey adapter: these tests verify OUR handlers, not the
 * adapter's cross-server relay (that needs two processes and a live Valkey).
 */
export async function startSocketServer() {
  const server = http.createServer(app);
  const io = new Server(server);

  registerSocketHandlers(io);
  setIO(io); // so HTTP services can push notifications, exactly as in server.js

  await new Promise((resolve) => server.listen(0, resolve));
  return { server, io, url: `http://localhost:${server.address().port}` };
}

export async function stopSocketServer({ server, io }) {
  setIO(null);
  io.close();
  await new Promise((resolve) => server.close(resolve));
}

/**
 * Connects a client and resolves once the server signals "ready" — i.e. after
 * it has attached handlers and joined this user's rooms. Resolving on "connect"
 * alone would race the server's async setup.
 */
export function connectClient(url, token) {
  const socket = ioClient(url, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  return new Promise((resolve, reject) => {
    socket.once(SOCKET_EVENTS.READY, () => resolve(socket));
    socket.once("connect_error", reject);
  });
}

/** Resolves with the next payload for `event`, or rejects on timeout. */
export function waitFor(socket, event, timeoutMs = 3000) {
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

/** Asserts an event does NOT arrive within the window. */
export async function expectNoEvent(socket, event, windowMs = 300) {
  let fired = false;
  const mark = () => (fired = true);
  socket.once(event, mark);
  await new Promise((r) => setTimeout(r, windowMs));
  socket.off(event, mark);
  return fired;
}

/** Promisified emit-with-ack. */
export const emitAck = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));
