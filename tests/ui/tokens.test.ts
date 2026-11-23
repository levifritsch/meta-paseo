import { describe, expect, it } from "vitest";
import { CARD_STATES } from "../../shared/core";
import { canStep, stepValue } from "../../client/ui/atoms/stepper-math";
import { FONT_SCALE, SESSION_COLORS, palette, stateColor, tint } from "../../client/ui/tokens";

const theme = {
  colors: {
    surface0: "#000000", surface1: "#111111", surface2: "#222222", border: "#333333",
    foreground: "#ffffff", foregroundMuted: "#888888", accent: "#0000ff", accentForeground: "#ffffff",
    statusSuccess: "#00ff00", statusWarning: "#ffaa00", statusDanger: "#ff0000",
  },
};

describe("tokens", () => {
  it("has fifteen unique session colors; white and gray are manual only", () => {
    expect(SESSION_COLORS).toHaveLength(15);
    expect(new Set(SESSION_COLORS.map((c) => c.id)).size).toBe(15);
    expect(new Set(SESSION_COLORS.map((c) => c.hex)).size).toBe(15);
    expect(SESSION_COLORS.filter((c) => !c.auto).map((c) => c.id)).toEqual(["white", "gray"]);
  });
  it("gives every card state its own color", () => {
    const p = palette(theme);
    expect(new Set(CARD_STATES.map((s) => stateColor(p, s))).size).toBe(CARD_STATES.length);
  });
  it("tints hex colors and leaves other formats alone", () => {
    expect(tint("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
    expect(tint("red", 0.5)).toBe("red");
  });
});

describe("stepper math", () => {
  const { min, max, step } = FONT_SCALE;
  it("steps without float drift", () => {
    let v: number = min;
    for (let i = 0; i < 3; i++) v = stepValue(v, 1, min, max, step);
    expect(v).toBe(1.1);
  });
  it("clamps at both ends", () => {
    expect(stepValue(max, 1, min, max, step)).toBe(max);
    expect(stepValue(min, -1, min, max, step)).toBe(min);
  });
  it("reports whether a step is possible", () => {
    expect(canStep(max, 1, min, max)).toBe(false);
    expect(canStep(1, 1, min, max)).toBe(true);
    expect(canStep(min, -1, min, max)).toBe(false);
  });
});
