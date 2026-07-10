import { jest } from "@jest/globals";
import { withAck, chatRoomsOf } from "../../../src/socket/helpers.js";
import { userChannel } from "../../../src/constants/index.js";

describe("withAck", () => {
  it("acks { ok: true } and spreads the handler's result", async () => {
    const ack = jest.fn();
    const handler = withAck(async () => ({ message: "hi" }));

    await handler({ roomId: "r" }, ack);

    expect(ack).toHaveBeenCalledWith({ ok: true, message: "hi" });
  });

  it("acks { ok: true } when the handler returns nothing", async () => {
    const ack = jest.fn();
    await withAck(async () => {})(ack);

    expect(ack).toHaveBeenCalledWith({ ok: true });
  });

  it("converts a thrown error into { ok: false, error } instead of crashing", async () => {
    const ack = jest.fn();

    await withAck(async () => {
      throw new Error("Not a member");
    })({}, ack);

    expect(ack).toHaveBeenCalledWith({ ok: false, error: "Not a member" });
  });

  it("passes the payload through, minus the ack callback", async () => {
    const handler = jest.fn();
    await withAck(handler)({ roomId: "r", text: "hi" }, jest.fn());

    expect(handler).toHaveBeenCalledWith({ roomId: "r", text: "hi" });
  });

  it("does not blow up when the client omits the ack", async () => {
    await expect(withAck(async () => ({ ok: 1 }))({ roomId: "r" })).resolves.toBeUndefined();
  });

  it("swallows the error when there is no ack to report it to", async () => {
    const handler = withAck(async () => {
      throw new Error("boom");
    });

    await expect(handler({})).resolves.toBeUndefined();
  });
});

describe("chatRoomsOf", () => {
  const socket = (rooms, id = "sock-1", userId = "u1") => ({
    id,
    rooms: new Set(rooms),
    user: { id: userId },
  });

  it("excludes the socket's own id and its personal user channel", () => {
    const s = socket(["sock-1", userChannel("u1"), "room-a", "room-b"]);

    expect(chatRoomsOf(s)).toEqual(["room-a", "room-b"]);
  });

  it("returns an empty list when the socket is in no rooms", () => {
    expect(chatRoomsOf(socket(["sock-1", userChannel("u1")]))).toEqual([]);
  });

  it("does not confuse another user's channel with its own", () => {
    const s = socket(["sock-1", userChannel("u1"), userChannel("u2")]);

    expect(chatRoomsOf(s)).toEqual([userChannel("u2")]);
  });
});
