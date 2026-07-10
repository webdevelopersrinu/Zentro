import Valkey from "iovalkey";
import { createAdapter } from "socket.io-valkey-adapter";
import { logger } from "../lib/logger.js";

/**
 * Builds the Valkey-backed adapter and attaches it to the Socket.IO server.
 *
 * THIS is the piece that keeps multiple servers in sync. Each server opens TWO
 * connections to the SAME Valkey:
 *   - pubClient: publishes messages out to Valkey
 *   - subClient: subscribes to messages coming from other servers
 * When EC2 #1 publishes a chat message, Valkey broadcasts it and EC2 #2's
 * subClient receives it, so users on different servers still chat together.
 *
 * A subscribed connection cannot issue ordinary commands, so the refresh-token
 * store gets its own client — see createValkeyClient below.
 */
export async function attachValkeyAdapter(io, valkeyUrl) {
  const pubClient = createValkeyClient(valkeyUrl, "pub");
  const subClient = pubClient.duplicate();
  subClient.on("error", (e) => logger.error("Valkey sub error:", e.message));

  io.adapter(createAdapter(pubClient, subClient));
  logger.info("✅ Valkey adapter attached (servers are now in sync)");

  return { pubClient, subClient };
}

/** A normal command client — used by the refresh-token store. */
export function createValkeyClient(valkeyUrl, label = "client") {
  const client = new Valkey(valkeyUrl);
  client.on("error", (e) => logger.error(`Valkey ${label} error:`, e.message));
  return client;
}
