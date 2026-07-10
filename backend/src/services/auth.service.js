import * as userService from "./user.service.js";

/**
 * Turn a provider's display name / email into a unique, URL-safe username.
 * "Srinu Desetti" → "srinu-desetti", and "srinu-desetti-2" if that's taken.
 */
export async function buildUniqueUsername(seed) {
  const base =
    (seed ?? "user")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user";

  let candidate = base;
  let suffix = 1;
  while (await userService.existsWithUsername(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * One account per (provider, providerId) pair. Created on first sign-in with
 * the name and avatar the provider gave us.
 */
export async function findOrCreateSocialUser({
  provider,
  providerId,
  name,
  email,
  avatarUrl,
}) {
  const existing = await userService.findByProvider(provider, providerId);
  if (existing) return existing;

  const username = await buildUniqueUsername(name || email?.split("@")[0]);
  return userService.createUser({
    provider,
    providerId,
    name,
    email,
    avatarUrl,
    username,
  });
}
