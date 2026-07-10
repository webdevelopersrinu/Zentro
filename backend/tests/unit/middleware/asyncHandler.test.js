import { jest } from "@jest/globals";
import { asyncHandler } from "../../../src/middleware/asyncHandler.js";

describe("asyncHandler", () => {
  it("invokes the wrapped handler with (req, res, next)", async () => {
    const handler = jest.fn();
    const req = {};
    const res = {};
    const next = jest.fn();

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it("does not call next when the handler resolves", async () => {
    const next = jest.fn();
    await asyncHandler(async () => "done")({}, {}, next);

    expect(next).not.toHaveBeenCalled();
  });

  it("forwards a rejected promise to next, instead of hanging the request", async () => {
    const boom = new Error("boom");
    const next = jest.fn();

    await asyncHandler(async () => {
      throw boom;
    })({}, {}, next);

    expect(next).toHaveBeenCalledWith(boom);
  });

  it("forwards a synchronous throw too", async () => {
    const boom = new Error("sync boom");
    const next = jest.fn();

    await asyncHandler(() => {
      throw boom;
    })({}, {}, next);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
