import {
  createRoomSchema,
  updateRoomSchema,
  inviteSchema,
} from "../../../src/validators/room.validators.js";
import { ROOM_VISIBILITY } from "../../../src/constants/index.js";

const parse = (schema, value) => schema.safeParse(value);

describe("createRoomSchema", () => {
  it("defaults visibility to public", () => {
    const result = parse(createRoomSchema, { name: "lobby" });

    expect(result.success).toBe(true);
    expect(result.data.visibility).toBe(ROOM_VISIBILITY.PUBLIC);
  });

  it("strips markup from the name", () => {
    const result = parse(createRoomSchema, { name: "<b>lobby</b>" });

    expect(result.data.name).toBe("lobby");
  });

  it("rejects a name that is markup only — sanitising must happen BEFORE min(1)", () => {
    expect(parse(createRoomSchema, { name: "<b></b>" }).success).toBe(false);
  });

  it("counts length after stripping, so tags cannot smuggle past the cap", () => {
    const name = `<b>${"x".repeat(40)}</b>`;

    expect(parse(createRoomSchema, { name }).success).toBe(true);
    expect(parse(createRoomSchema, { name: "x".repeat(41) }).success).toBe(false);
  });

  it.each([[""], ["   "], [undefined], [null], [42], [{ $ne: null }]])(
    "rejects an invalid name (%p)",
    (name) => {
      expect(parse(createRoomSchema, { name }).success).toBe(false);
    }
  );

  it.each([["secret"], [""], [null], [1]])("rejects visibility %p", (visibility) => {
    expect(parse(createRoomSchema, { name: "ok", visibility }).success).toBe(false);
  });
});

describe("updateRoomSchema", () => {
  it("accepts a name-only patch", () => {
    expect(parse(updateRoomSchema, { name: "renamed" }).success).toBe(true);
  });

  it("accepts a visibility-only patch", () => {
    expect(
      parse(updateRoomSchema, { visibility: ROOM_VISIBILITY.PRIVATE }).success
    ).toBe(true);
  });

  it("rejects an empty patch", () => {
    const result = parse(updateRoomSchema, {});

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toMatch(/nothing to update/i);
  });
});

describe("inviteSchema", () => {
  it("trims the username", () => {
    expect(parse(inviteSchema, { username: "  alice " }).data.username).toBe("alice");
  });

  it("rejects an operator object — the NoSQL injection vector", () => {
    expect(parse(inviteSchema, { username: { $ne: null } }).success).toBe(false);
  });

  it.each([[""], ["   "], [undefined], ["x".repeat(31)]])(
    "rejects %p",
    (username) => {
      expect(parse(inviteSchema, { username }).success).toBe(false);
    }
  );
});
