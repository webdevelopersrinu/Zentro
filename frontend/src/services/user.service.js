import { api } from "../lib/apiClient.js";

/**
 * `signal` lets React Query abort a stale search when the user keeps typing,
 * so a slow early request can never overwrite a fast later one.
 */
export const searchUsers = (query, signal) =>
  api
    .get("/users/search", { params: { q: query }, signal })
    .then(({ data }) => data.users);
