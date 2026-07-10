import { stripHtml, stripMongoOperators } from "../../../src/utils/sanitize.js";

describe("stripHtml", () => {
  it.each([
    ["<b>bold</b>", "bold"],
    ["<script>alert(1)</script>safe", "safe"],
    ["<img src=x onerror=alert(1)>hi", "hi"],
    ["plain text", "plain text"],
    ["  padded  ", "padded"],
  ])("%s -> %s", (input, expected) => {
    expect(stripHtml(input)).toBe(expected);
  });

  it("removes the script CONTENTS, not just the tags", () => {
    expect(stripHtml("<script>alert(1)</script>")).toBe("");
  });

  it("leaves the text of non-script tags", () => {
    expect(stripHtml("<div>keep <b>this</b></div>")).toBe("keep this");
  });

  it("coerces null and undefined to an empty string", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
  });

  it("does not mangle legitimate punctuation or emoji", () => {
    expect(stripHtml("2 < 3 && 5 > 4 🚀")).toContain("🚀");
    expect(stripHtml("hello, world!")).toBe("hello, world!");
  });
});

describe("stripMongoOperators", () => {
  it("removes $-prefixed keys", () => {
    expect(stripMongoOperators({ username: { $ne: null } })).toEqual({ username: {} });
  });

  it("removes dotted keys used for path traversal", () => {
    expect(stripMongoOperators({ "a.b": 1, ok: 2 })).toEqual({ ok: 2 });
  });

  it("recurses into nested objects", () => {
    const input = { filter: { nested: { $gt: 5, keep: 1 } } };

    expect(stripMongoOperators(input)).toEqual({ filter: { nested: { keep: 1 } } });
  });

  it("mutates in place — req.query is getter-only and cannot be reassigned", () => {
    const query = { q: "hi", $where: "evil" };

    const returned = stripMongoOperators(query);

    expect(returned).toBe(query); // same reference
    expect(query).toEqual({ q: "hi" }); // original object was cleaned
  });

  it("leaves clean payloads untouched", () => {
    expect(stripMongoOperators({ name: "lobby", visibility: "public" })).toEqual({
      name: "lobby",
      visibility: "public",
    });
  });

  it.each([[null], [undefined], ["a string"], [42]])(
    "passes through non-objects (%p)",
    (value) => {
      expect(stripMongoOperators(value)).toBe(value);
    }
  );
});
