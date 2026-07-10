import { RefreshToken } from "../models/RefreshToken.js";

/**
 * Persistence for refresh tokens. One interface, three implementations:
 *
 *   MongoTokenStore  — production. Durable, replicated, isolated in its own
 *                      collection, expired by a TTL index, and auditable.
 *   MemoryTokenStore — unit tests. Same semantics, no infrastructure.
 *   ValkeyTokenStore — kept for reference. Valkey is a cache: our instance has
 *                      no volume and shares db0 with other projects, so a
 *                      restart or a stray FLUSHDB would log out every user.
 *                      Valkey's job here is the message bus, not session state.
 *
 * Callers pass a SHA-256 hash, never the token itself.
 */

export class MongoTokenStore {
  async save(hash, record, ttlSeconds) {
    await RefreshToken.create({
      tokenHash: hash,
      userId: record.userId,
      family: record.family,
      used: false,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      ip: record.ip,
      userAgent: record.userAgent,
    });
  }

  async get(hash) {
    // The TTL reaper runs about once a minute, so an expired document may still
    // be present. Filter on expiresAt rather than trusting the index's timing.
    const doc = await RefreshToken.findOne({
      tokenHash: hash,
      expiresAt: { $gt: new Date() },
    }).lean();

    return doc ? { userId: doc.userId, family: doc.family, used: doc.used } : null;
  }

  async markUsed(hash) {
    await RefreshToken.updateOne({ tokenHash: hash }, { $set: { used: true } });
  }

  async revokeFamily(family) {
    await RefreshToken.deleteMany({ family });
  }
}

export class MemoryTokenStore {
  constructor() {
    this.tokens = new Map(); // hash -> record
    this.families = new Map(); // family -> Set<hash>
  }

  async save(hash, record) {
    this.tokens.set(hash, record);
    if (!this.families.has(record.family)) this.families.set(record.family, new Set());
    this.families.get(record.family).add(hash);
  }

  async get(hash) {
    return this.tokens.get(hash) ?? null;
  }

  async markUsed(hash, record) {
    this.tokens.set(hash, { ...record, used: true });
  }

  async revokeFamily(family) {
    for (const hash of this.families.get(family) ?? []) this.tokens.delete(hash);
    this.families.delete(family);
  }
}

const familyKey = (family) => `rtf:${family}`;
const tokenKey = (hash) => `rt:${hash}`;

export class ValkeyTokenStore {
  constructor(client) {
    this.client = client;
  }

  async save(hash, record, ttlSeconds) {
    await this.client
      .multi()
      .set(tokenKey(hash), JSON.stringify(record), "EX", ttlSeconds)
      .sadd(familyKey(record.family), hash)
      .expire(familyKey(record.family), ttlSeconds)
      .exec();
  }

  async get(hash) {
    const raw = await this.client.get(tokenKey(hash));
    return raw ? JSON.parse(raw) : null;
  }

  async markUsed(hash, record, ttlSeconds) {
    await this.client.set(
      tokenKey(hash),
      JSON.stringify({ ...record, used: true }),
      "EX",
      ttlSeconds
    );
  }

  async revokeFamily(family) {
    const hashes = await this.client.smembers(familyKey(family));
    if (hashes.length) await this.client.del(...hashes.map(tokenKey));
    await this.client.del(familyKey(family));
  }
}

let store = new MemoryTokenStore();

export const setTokenStore = (impl) => {
  store = impl;
};
export const getTokenStore = () => store;
