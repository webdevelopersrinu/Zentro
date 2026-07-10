// MUST be first: populates process.env before any other module evaluates.
// (config/passport.js reads its OAuth credentials at import time.)
import "./config/env.js";

import http from "http";
import { Server } from "socket.io";

import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { attachValkeyAdapter } from "./config/valkey.js";
import { registerSocketHandlers } from "./socket/index.js";
import { setIO } from "./lib/io.js";
import { setTokenStore, MongoTokenStore } from "./lib/tokenStore.js";
import { logger } from "./lib/logger.js";

const { PORT = 4000, MONGO_URI, VALKEY_URL, CLIENT_ORIGIN = "*" } = process.env;

async function start() {
  await connectDB(MONGO_URI);

  // Refresh tokens live in MongoDB: durable, replicated, isolated in their own
  // collection, and expired automatically by a TTL index. Valkey is a cache —
  // a restart or a stray FLUSHDB there would log out every user.
  setTokenStore(new MongoTokenStore());
  logger.info("✅ Refresh-token store backed by MongoDB");

  const app = createApp();
  const server = http.createServer(app);

  // The Valkey adapter is what keeps multiple servers in sync.
  const io = new Server(server, { cors: { origin: CLIENT_ORIGIN } });
  const valkey = await attachValkeyAdapter(io, VALKEY_URL);
  registerSocketHandlers(io);

  // Let HTTP services push events to a specific user (see utils/notify.js).
  setIO(io);

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Stop the other process, or run with a different PORT.`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(PORT, () =>
    console.log(`🚀 Server listening on :${PORT} (pid ${process.pid})`)
  );

  const shutdown = async (signal) => {
    logger.info(`\n${signal} received — shutting down`);
    server.close();
    io.close();
    valkey.pubClient.disconnect();
    valkey.subClient.disconnect();
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
