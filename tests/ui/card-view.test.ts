import { describe, expect, it } from "vitest";
import { ageLabel, compactMeta, contextPercent, helperSummary, joinMeta } from "../../client/ui/features/card-view";

describe("ageLabel", () => {
  const now = 10_000_000_000;
  it.each([
    [0, "now"],
    [59_000, "now"],
    [60_000, "1m"],
    [59 * 60_000, "59m"],
    [3_600_000, "1h"],
    [23 * 3_600_000, "23h"],
    [86_400_000, "1d"],
    [-5_000, "now"],
  ])("%d ms ago reads %s", (ago, label) => expect(ageLabel(now - ago, now)).toBe(label));
});

describe("contextPercent", () => {
  it("rounds to a whole percent and passes unknown through", () => {
    expect(contextPercent(0.256)).toBe(26);
    expect(contextPercent(undefined)).toBeNull();
  });
});

describe("helperSummary", () => {
  it("is null with no helpers, and pluralizes", () => {
    expect(helperSummary(0, 0)).toBeNull();
    expect(helperSummary(1, 0)).toBe("1 sub-agent");
    expect(helperSummary(2, 1)).toBe("2 sub-agents · 1 background task");
  });
});

describe("compactMeta and joinMeta", () => {
  it("names the state and how long ago", () => {
    expect(compactMeta("running", "5m")).toBe("Running · 5m");
    expect(compactMeta("failed", "now")).toBe("Error · now");
  });
  it("drops empty parts", () => {
    expect(joinMeta("main", "5m")).toBe("main · 5m");
    expect(joinMeta(undefined, "5m")).toBe("5m");
    expect(joinMeta("", null, false)).toBe("");
  });
});
