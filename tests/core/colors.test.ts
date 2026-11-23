import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { assignColors, pickColor, pruneColors, type PaletteEntry } from "../../shared/core";

const palette: PaletteEntry[] = [
  { id: "a", auto: true },
  { id: "b", auto: true },
  { id: "c", auto: true },
  { id: "white", auto: false },
  { id: "gray", auto: false },
];
const seeded = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe("pickColor (P1)", () => {
  it("picks among the least used", () => {
    const colors = { s1: "a", s2: "a", s3: "b" };
    expect(pickColor(palette, colors, () => 0)).toBe("c");
  });
  it("uses the random number to choose between equally unused colors", () => {
    expect(pickColor(palette, {}, () => 0)).toBe("a");
    expect(pickColor(palette, {}, () => 0.5)).toBe("b");
    expect(pickColor(palette, {}, () => 0.99)).toBe("c");
  });
  it("never picks white or gray, even when they are the least used", () => {
    const colors = { s1: "a", s2: "b", s3: "c" };
    for (const r of [0, 0.3, 0.7, 0.999]) expect(["a", "b", "c"]).toContain(pickColor(palette, colors, () => r));
  });
  it("survives a rand of exactly 1", () => {
    expect(pickColor(palette, {}, () => 1)).toBe("c");
  });
  it("property: never white or gray, always a least-used color", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom("a", "b", "c", "white", "gray"), { maxLength: 30 }), fc.double({ min: 0, max: 1, noNaN: true }), (used, r) => {
        const colors = Object.fromEntries(used.map((c, i) => [`s${i}`, c]));
        const pick = pickColor(palette, colors, () => r);
        const count = (id: string) => used.filter((c) => c === id).length;
        expect(["a", "b", "c"]).toContain(pick);
        expect(count(pick)).toBe(Math.min(count("a"), count("b"), count("c")));
      }),
    );
  });
});

describe("assignColors (P2, P3)", () => {
  const sessions = [
    { id: "new", createdAt: 30 },
    { id: "old", createdAt: 10 },
    { id: "mid", createdAt: 20 },
  ];
  it("colors existing sessions oldest first, spreading them", () => {
    const out = assignColors(palette, {}, sessions, seeded(0));
    expect(out).toEqual({ old: "a", mid: "b", new: "c" });
  });
  it("keeps stored colors and returns the same object when nothing is missing", () => {
    const stored = { old: "c", mid: "c", new: "c" };
    expect(assignColors(palette, stored, sessions, seeded(0))).toBe(stored);
  });
  it("counts stored colors when coloring a newcomer", () => {
    const out = assignColors(palette, { old: "a", mid: "b" }, sessions, seeded(0));
    expect(out["new"]).toBe("c");
  });
  it("keeps a manual white", () => {
    const out = assignColors(palette, { old: "white" }, sessions, seeded(0));
    expect(out["old"]).toBe("white");
  });
});

describe("pruneColors", () => {
  it("drops gone sessions after a successful load", () => {
    expect(pruneColors({ a: "x", b: "y" }, new Set(["a"]), true)).toEqual({ a: "x" });
  });
  it("never prunes before a successful load (invariant 9)", () => {
    const colors = { a: "x", b: "y" };
    expect(pruneColors(colors, new Set(), false)).toBe(colors);
  });
});
