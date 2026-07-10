import {
  isMember,
  isCreator,
  hasRequested,
  assertMember,
  assertCreator,
} from "../../../src/services/room.service.js";

const ALICE = "aaaaaaaaaaaaaaaaaaaaaaaa";
const BOB = "bbbbbbbbbbbbbbbbbbbbbbbb";

/** Mongoose gives ObjectIds, not strings — the guards must compare by value. */
const objectId = (value) => ({ toString: () => value });

const room = (over = {}) => ({
  creator: objectId(ALICE),
  members: [objectId(ALICE)],
  joinRequests: [],
  ...over,
});

describe("membership predicates", () => {
  it("recognises a member regardless of ObjectId vs string", () => {
    expect(isMember(room(), ALICE)).toBe(true);
    expect(isMember(room({ members: [ALICE] }), ALICE)).toBe(true);
  });

  it("rejects a non-member", () => {
    expect(isMember(room(), BOB)).toBe(false);
  });

  it("recognises the creator", () => {
    expect(isCreator(room(), ALICE)).toBe(true);
    expect(isCreator(room(), BOB)).toBe(false);
  });

  it("recognises a pending requester", () => {
    expect(hasRequested(room({ joinRequests: [objectId(BOB)] }), BOB)).toBe(true);
    expect(hasRequested(room(), BOB)).toBe(false);
  });

  it("treats a missing joinRequests array as empty", () => {
    expect(hasRequested(room({ joinRequests: undefined }), BOB)).toBe(false);
  });

  it("does not match on a substring of an id", () => {
    expect(isMember(room({ members: [objectId("aaa")] }), ALICE)).toBe(false);
  });
});

describe("assertMember", () => {
  it("passes for a member", () => {
    expect(() => assertMember(room(), ALICE)).not.toThrow();
  });

  it("throws 403 for a non-member", () => {
    expect(() => assertMember(room(), BOB)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});

describe("assertCreator", () => {
  it("passes for the creator", () => {
    expect(() => assertCreator(room(), ALICE)).not.toThrow();
  });

  it("throws 403 for anyone else, even a member", () => {
    const shared = room({ members: [objectId(ALICE), objectId(BOB)] });

    expect(() => assertCreator(shared, BOB)).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it("names the attempted action in the message", () => {
    expect(() => assertCreator(room(), BOB, "delete")).toThrow(/can delete/i);
  });
});
