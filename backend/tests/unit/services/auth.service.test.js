import { jest } from "@jest/globals";

/**
 * ESM modules are immutable bindings, so a spy cannot be attached after import.
 * jest.unstable_mockModule must be registered BEFORE the module under test is
 * dynamically imported — hence the await import() below rather than a static one.
 */
const userService = {
  existsWithUsername: jest.fn(),
  findByProvider: jest.fn(),
  createUser: jest.fn(),
};

jest.unstable_mockModule("../../../src/services/user.service.js", () => userService);

const { buildUniqueUsername, findOrCreateSocialUser } = await import(
  "../../../src/services/auth.service.js"
);

beforeEach(() => jest.clearAllMocks());

describe("buildUniqueUsername", () => {
  const free = () => userService.existsWithUsername.mockResolvedValue(false);

  it("slugifies a display name", async () => {
    free();
    await expect(buildUniqueUsername("Srinu Desetti")).resolves.toBe("srinu-desetti");
  });

  it.each([
    ["Alice O'Hara", "alice-o-hara"],
    ["  spaced  out  ", "spaced-out"],
    ["UPPER case", "upper-case"],
    ["emoji 🚀 name", "emoji-name"],
    ["...leading.dots...", "leading-dots"],
  ])("%s -> %s", async (input, expected) => {
    free();
    await expect(buildUniqueUsername(input)).resolves.toBe(expected);
  });

  it("falls back to 'user' when nothing survives slugification", async () => {
    free();
    await expect(buildUniqueUsername("🚀🚀🚀")).resolves.toBe("user");
    await expect(buildUniqueUsername(undefined)).resolves.toBe("user");
  });

  it("truncates to 24 characters", async () => {
    free();
    const result = await buildUniqueUsername("a".repeat(50));

    expect(result).toHaveLength(24);
  });

  it("appends a counter until the username is free", async () => {
    userService.existsWithUsername
      .mockResolvedValueOnce(true) // alice
      .mockResolvedValueOnce(true) // alice-2
      .mockResolvedValueOnce(false); // alice-3

    await expect(buildUniqueUsername("alice")).resolves.toBe("alice-3");
    expect(userService.existsWithUsername).toHaveBeenCalledTimes(3);
  });
});

describe("findOrCreateSocialUser", () => {
  const profile = {
    provider: "google",
    providerId: "g-1",
    name: "Srinu Desetti",
    email: "srinu@example.com",
    avatarUrl: "http://x/a.png",
  };

  it("returns the existing account without creating a duplicate", async () => {
    const existing = { _id: "u1", username: "srinu-desetti" };
    userService.findByProvider.mockResolvedValue(existing);

    await expect(findOrCreateSocialUser(profile)).resolves.toBe(existing);
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it("creates the account on first sign-in, deriving a username", async () => {
    userService.findByProvider.mockResolvedValue(null);
    userService.existsWithUsername.mockResolvedValue(false);
    userService.createUser.mockImplementation(async (data) => data);

    const user = await findOrCreateSocialUser(profile);

    expect(user).toMatchObject({
      provider: "google",
      providerId: "g-1",
      username: "srinu-desetti",
    });
  });

  it("derives the username from the email when the provider gives no name", async () => {
    userService.findByProvider.mockResolvedValue(null);
    userService.existsWithUsername.mockResolvedValue(false);
    userService.createUser.mockImplementation(async (data) => data);

    const user = await findOrCreateSocialUser({ ...profile, name: undefined });

    expect(user.username).toBe("srinu");
  });

  it("looks the user up by (provider, providerId), not by email", async () => {
    userService.findByProvider.mockResolvedValue({ _id: "u1" });

    await findOrCreateSocialUser(profile);

    expect(userService.findByProvider).toHaveBeenCalledWith("google", "g-1");
  });
});
