import { AppError } from "../../../src/utils/AppError.js";
import { HTTP_STATUS } from "../../../src/constants/index.js";

describe("AppError", () => {
  it("is a real Error, so instanceof and stack traces work", () => {
    const err = new AppError("boom", 500);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.stack).toEqual(expect.any(String));
  });

  it("defaults to 500", () => {
    expect(new AppError("boom").statusCode).toBe(HTTP_STATUS.INTERNAL);
  });

  it("marks itself operational, so the error handler may show its message", () => {
    expect(new AppError("boom").isOperational).toBe(true);
  });

  it.each([
    ["badRequest", HTTP_STATUS.BAD_REQUEST],
    ["unauthorized", HTTP_STATUS.UNAUTHORIZED],
    ["forbidden", HTTP_STATUS.FORBIDDEN],
    ["notFound", HTTP_STATUS.NOT_FOUND],
    ["conflict", HTTP_STATUS.CONFLICT],
    ["tooManyRequests", HTTP_STATUS.TOO_MANY_REQUESTS],
  ])("%s() maps to %i", (factory, status) => {
    const err = AppError[factory]("msg");

    expect(err.statusCode).toBe(status);
    expect(err.message).toBe("msg");
    expect(err).toBeInstanceOf(AppError);
  });

  it("each factory has a sensible default message", () => {
    expect(AppError.notFound().message).toBe("Not found");
    expect(AppError.forbidden().message).toBe("Forbidden");
  });
});
