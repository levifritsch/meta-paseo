import { describe, expect, it } from "vitest";
import { CARD_STATES } from "../../shared/core";
import { canStep, stepValue } from "../../client/ui/atoms/stepper-math";
import { VIEW_LIMITS } from "../../shared/core";
import { SESSION_COLORS, font, fadeBands, isDark, mix, palette, scaledFont, scrollbarCss, stateColor, tint } from "../../client/ui/tokens/tokens";

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
  const { min, max, step } = VIEW_LIMITS.fontScale;
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

describe("scaledFont", () => {
  it("is the fixed sizes at scale 1", () => expect(scaledFont(1)).toBe(font));
  it("scales every size, to a tenth of a pixel", () => {
    expect(scaledFont(1.5).sm).toBe(18);
    expect(scaledFont(1.5).md).toBe(19.5);
    expect(scaledFont(0.8).heading).toBe(14.4);
    expect(Object.keys(scaledFont(1.2))).toEqual(Object.keys(font));
  });
});

describe("color helpers", () => {
  it("mix moves toward the target and leaves other formats alone", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#102030", "#ffffff", 0)).toBe("#102030");
    expect(mix("rgb(1,2,3)", "#ffffff", 0.5)).toBe("rgb(1,2,3)");
  });
  it("isDark reads luminance, and unreadable colors count as dark", () => {
    expect(isDark("#111111")).toBe(true);
    expect(isDark("#ffffff")).toBe(false);
    expect(isDark("red")).toBe(true);
  });
  it("fadeBands fall from the edge color to nearly nothing, or null for a non-hex color", () => {
    const bands = fadeBands("#000000", 4)!;
    expect(bands).toHaveLength(4);
    expect(bands[0]).toBe("rgba(0, 0, 0, 0.92)");
    expect(fadeBands("red", 4)).toBeNull();
  });
});

describe("scrollbar", () => {
  it("styles a thin faint thumb, scoped to the plugin's tree", () => {
    const css = scrollbarCss(palette(theme));
    expect(css).toContain("[data-meta-paseo] *::-webkit-scrollbar-thumb");
    expect(css).toContain("width: 5px");
    expect(css.split("\n").every((l) => l.includes("[data-meta-paseo]"))).toBe(true);
  });
});
