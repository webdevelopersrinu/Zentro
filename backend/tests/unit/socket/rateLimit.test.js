import { jest } from "@jest/globals";
import { socketRateLimiter } from "../../../src/socket/rateLimit.js";

describe("socketRateLimiter", () => {
  beforeEach(() => jest.useFakeTimers({ now: 0 }));
  afterEach(() => jest.useRealTimers());

  const limiter = (opts) => socketRateLimiter(opts)({});

  it("allows up to `max` events in the window", () => {
    const consume = limiter({ windowMs: 1000, max: 3 });

    expect(() => {
      consume();
      consume();
      consume();
    }).not.toThrow();
  });

  it("throws once the budget is exhausted", () => {
    const consume = limiter({ windowMs: 1000, max: 2 });
    consume();
    consume();

    expect(() => consume()).toThrow(/Slow down/i);
  });

  it("reports 429, not 500", () => {
    const consume = limiter({ windowMs: 1000, max: 1 });
    consume();

    expect(() => consume()).toThrow(expect.objectContaining({ statusCode: 429 }));
  });

  it("slides: budget frees up as old hits age out", () => {
    const consume = limiter({ windowMs: 1000, max: 2 });
    consume();
    consume();
    expect(() => consume()).toThrow();

    jest.setSystemTime(1001); // both hits are now outside the window
    expect(() => consume()).not.toThrow();
  });

  it("only partially frees the window", () => {
    const consume = limiter({ windowMs: 1000, max: 2 });
    consume(); // t=0
    jest.setSystemTime(600);
    consume(); // t=600

    jest.setSystemTime(1001); // the t=0 hit expires, the t=600 hit does not
    expect(() => consume()).not.toThrow(); // one slot freed
    expect(() => consume()).toThrow(); // budget full again
  });

  it("gives each socket its own independent budget", () => {
    const factory = socketRateLimiter({ windowMs: 1000, max: 1 });
    const alice = factory({});
    const bob = factory({});

    alice();
    expect(() => alice()).toThrow();
    expect(() => bob()).not.toThrow(); // bob is unaffected
  });
});
