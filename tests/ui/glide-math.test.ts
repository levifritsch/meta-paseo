import { describe, expect, it } from "vitest";
import { glideOffset, shouldEnter } from "../../client/ui/behaviors/glide-math";

describe("glide", () => {
  it("slides from the old place", () => {
    expect(glideOffset(100, 40, true)).toBe(60);
    expect(glideOffset(40, 100, true)).toBe(-60);
  });
  it("does not slide on first layout, or for sub-pixel moves", () => {
    expect(glideOffset(undefined, 40, true)).toBeNull();
    expect(glideOffset(40.3, 40, true)).toBeNull();
  });
  it("does not slide under reduced motion", () => {
    expect(glideOffset(100, 40, false)).toBeNull();
  });
  it("continues from where an unfinished slide shows the card", () => {
    expect(glideOffset(100, 40, true, 15)).toBe(75);
  });
  it("grows a card in only if it joined after load and motion is allowed", () => {
    expect(shouldEnter(false, false)).toBe(true);
    expect(shouldEnter(true, false)).toBe(false);
    expect(shouldEnter(false, true)).toBe(false);
  });
});

import { layoutPositions } from "../../client/ui/behaviors/glide-math";

describe("layoutPositions", () => {
  it("stacks cards by height and gap", () => {
    expect(layoutPositions([40, 100, 40], 8)).toEqual([0, 48, 156]);
  });
  it("has no position after a card of unknown height", () => {
    expect(layoutPositions([40, undefined, 40], 8)).toEqual([0, 48, undefined]);
  });
  it("is empty for no cards", () => {
    expect(layoutPositions([], 8)).toEqual([]);
  });
});
