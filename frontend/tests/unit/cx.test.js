import { describe, expect, it } from "vitest";

import { cx } from "../../src/lib/cx.js";

describe("cx", () => {
  it("joins truthy class names", () => {
    expect(cx("a", "b")).toBe("a b");
  });

  it.each([[false], [null], [undefined], [""], [0]])("drops %p", (value) => {
    expect(cx("a", value, "b")).toBe("a b");
  });

  it("supports the `condition && class` idiom", () => {
    const loading = true;
    const disabled = false;

    expect(cx("btn", loading && "loading", disabled && "disabled")).toBe("btn loading");
  });

  it("flattens arrays", () => {
    expect(cx("a", ["b", "c"])).toBe("a b c");
  });

  it("returns an empty string when nothing applies", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
