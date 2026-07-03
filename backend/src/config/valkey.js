import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

// Builds the Valkey-backed adapter and attaches it to the Socket.IO server.
//
// THIS is the piece that keeps multiple servers in sync. Each server opens TWO
// connections to the SAME Valkey:
//   - pubClient: publishes messages out to Valkey
//   - subClient: subscribes to messages coming from other servers
// When EC2 #1 publishes a chat message, Valkey broadcasts it and EC2 #2's
// subClient receives it, so users on different servers still chat together.
//
// (Valkey is a Redis-compatible fork, so the standard `redis` client works.)
export async function attachValkeyAdapter(io, valkeyUrl) {
  const pubClient = createClient({ url: valkeyUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (e) => console.error("Valkey pub error:", e.message));
  subClient.on("error", (e) => console.error("Valkey sub error:", e.message));

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Valkey adapter attached (servers are now in sync)");

  return { pubClient, subClient };
}
