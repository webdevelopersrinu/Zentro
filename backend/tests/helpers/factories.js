import request from "supertest";
import { User } from "../../src/models/User.js";
import { signAccessToken } from "../../src/services/token.service.js";
import { AUTH_PROVIDER } from "../../src/constants/index.js";
import { app } from "./setup.js";

// Monotonic within a file; each test file has its own database (see setup.js),
// so a plain counter can't collide on the unique (provider, providerId) index.
let seq = 0;

/** Creates a user exactly as the OAuth flow would, and returns an API client. */
export async function createUser(overrides = {}) {
  const id = (seq += 1);
  const user = await User.create({
    provider: AUTH_PROVIDER.GOOGLE,
    providerId: `test-provider-${id}`,
    username: `user-${id}`,
    name: `User ${id}`,
    email: `user-${id}@test.local`,
    ...overrides,
  });

  const token = signAccessToken(user);
  return { user, token, client: apiClient(token) };
}

/** Thin supertest wrapper that always carries the caller's bearer token. */
export function apiClient(token) {
  const auth = (req) => (token ? req.set("Authorization", `Bearer ${token}`) : req);
  return {
    get: (url) => auth(request(app).get(url)),
    post: (url, body) => auth(request(app).post(url)).send(body ?? {}),
    patch: (url, body) => auth(request(app).patch(url)).send(body ?? {}),
    delete: (url) => auth(request(app).delete(url)),
  };
}

export const anonymous = () => apiClient(null);

/** Creates a room owned by `client`. */
export async function createRoom(client, body) {
  const res = await client.post("/api/rooms", body);
  return res.body.room;
}
