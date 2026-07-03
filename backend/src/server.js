import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { attachValkeyAdapter } from "./config/valkey.js";
import { registerSocketHandlers } from "./socket/index.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";

const {
  PORT = 4000,
  MONGO_URI,
  VALKEY_URL,
  CLIENT_ORIGIN = "*",
} = process.env;

async function start() {
  // 1. Database (shared by all servers)
  await connectDB(MONGO_URI);

  // 2. HTTP + Express API
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true, pid: process.pid }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/rooms", roomRoutes);

  const server = http.createServer(app);

  // 3. Socket.IO + Valkey adapter (this is what syncs the 2 servers)
  const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
  await attachValkeyAdapter(io, VALKEY_URL);
  registerSocketHandlers(io);

  // 4. Listen
  server.listen(PORT, () =>
    console.log(`🚀 Server listening on :${PORT} (pid ${process.pid})`)
  );
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
