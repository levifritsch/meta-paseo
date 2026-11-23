// The one place for colors, spacing, type and motion. No magic numbers elsewhere.
import type { PluginTheme } from "@getpaseo/plugin";
import type { CardState } from "../../core";

export type Palette = {
  bg: string;
  card: string;
  chrome: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  done: string;
  question: string;
  error: string;
  permission: string;
  running: string;
  info: string;
};

/** Paseo's theme colors, plus violet and blue, which the theme has no tokens for. */
export function palette(theme: PluginTheme): Palette {
  const c = theme.colors;
  return {
    bg: c.surface0,
    card: c.surface1,
    chrome: c.surface2,
    border: c.border,
    text: c.foreground,
    muted: c.foregroundMuted,
    accent: c.accent,
    onAccent: c.accentForeground,
    done: c.statusSuccess,
    question: c.statusWarning,
    error: c.statusDanger,
    permission: "#8b5cf6",
    running: "#3b82f6",
    info: "#3b82f6",
  };
}

export function stateColor(p: Palette, state: CardState): string {
  switch (state) {
    case "needs":
      return p.question;
    case "failed":
      return p.error;
    case "done":
      return p.done;
    case "permission":
      return p.permission;
    case "running":
      return p.running;
  }
}

/** Badge tones, loudest first: danger for failure, warning for permission, info for question. */
export type Tone = "danger" | "warning" | "info" | "neutral";
export function toneColor(p: Palette, tone: Tone): string {
  return tone === "danger" ? p.error : tone === "warning" ? p.permission : tone === "info" ? p.question : p.muted;
}

/** `#rrggbb` at `alpha`; other color formats come back unchanged. */
export function tint(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  const n = parseInt(hex[1]!, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export const space = { xs: 2, sm: 4, md: 8, lg: 12, xl: 16 } as const;
export const radius = { sm: 4, md: 8, pill: 999 } as const;
export const font = { xs: 10, sm: 12, md: 14, lg: 16 } as const;
export const size = { dot: 8, control: 28, badge: 18 } as const;
export const motion = { fast: 120, base: 200, shake: 320 } as const;
export const FONT_SCALE = { min: 0.8, max: 1.5, step: 0.1 } as const;

export type SessionColor = { id: string; hex: string; auto: boolean };

/**
 * Fifteen fixed session colors, in the same order as `session-board` so a stored slot index
 * means the same color in both. White and gray are only picked by hand.
 */
export const SESSION_COLORS: readonly SessionColor[] = [
  { id: "red", hex: "#d33c35", auto: true },
  { id: "orange", hex: "#e26936", auto: true },
  { id: "amber", hex: "#e2a936", auto: true },
  { id: "lime", hex: "#a7c950", auto: true },
  { id: "green", hex: "#4ab77c", auto: true },
  { id: "teal", hex: "#21b2bc", auto: true },
  { id: "blue", hex: "#398ede", auto: true },
  { id: "indigo", hex: "#4a4fc7", auto: true },
  { id: "purple", hex: "#7b3ae2", auto: true },
  { id: "orchid", hex: "#aa4eb3", auto: true },
  { id: "pink", hex: "#e776d6", auto: true },
  { id: "rose", hex: "#dd3482", auto: true },
  { id: "white", hex: "#ffffff", auto: false },
  { id: "brown", hex: "#814830", auto: true },
  { id: "gray", hex: "#8b8b8b", auto: false },
];
