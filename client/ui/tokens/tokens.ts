// The one place for colors, spacing, type and motion. No magic numbers elsewhere.
import type { PluginTheme } from "@getpaseo/plugin";
import type { CardState } from "../../../shared/core";

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

const sessionHex = (id: string) => SESSION_COLORS.find((c) => c.id === id)!.hex;

/**
 * Paseo's theme colors, and the session colors for states: question amber, permission purple,
 * running blue, done green, failed red. The theme's warning and danger colors did not read as
 * yellow and red here, and one set of colors keeps states and sessions alike.
 */
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
    done: sessionHex("green"),
    question: sessionHex("amber"),
    error: sessionHex("red"),
    permission: sessionHex("purple"),
    running: sessionHex("blue"),
    info: sessionHex("blue"),
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

/** The shape of a state's dot: a symbol per state, so state reads without color. */
export type DotShape = "circle" | "square" | "triangle" | "cross" | "spinner";
export const STATE_SHAPE: Record<CardState, DotShape> = { needs: "square", permission: "triangle", running: "spinner", done: "circle", failed: "cross" };

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

/** A scale in the steps the board uses. Names after `md` say where the odd steps sit. */
export const space = { xs: 2, thin: 3, sm: 4, tight: 5, run: 6, md: 8, snug: 9, mid: 10, cozy: 11, lg: 12, pad: 14, xl: 16, xxl: 28 } as const;
/** Lucide icon sizes. */
export const icon = { xs: 12, sm: 13, md: 14, lg: 15, xl: 16 } as const;
/** Opacities: a pressed control, a disabled one, a faint one, dimmed tool calls and chat. */
export const opacity = { pressed: 0.75, disabled: 0.45, faint: 0.5, tool: 0.5, chat: 0.8 } as const;
/** Widths as a share of the parent. */
export const share = { prompt: "88%" } as const;
/** Line height as a multiple of the font size. */
export const leading = { title: 1.3, body: 1.4 } as const;
/** Shadows under floating things (`elevation` is Android's). */
export const shadow = {
  popover: { shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  pill: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
} as const;
export const radius = { tail: 3, sm: 4, option: 5, control: 6, segment: 7, md: 8, menu: 9, bubble: 10, field: 12, card: 14, pill: 999 } as const;
/** Type sizes at scale 1. `useFont()` returns them scaled. */
export const font = { xxs: 10.5, xs: 11.5, sm: 12, md: 13, lg: 14, title: 15.5, heading: 18 } as const;
export type Font = { [K in keyof typeof font]: number };
/** The type sizes at `scale`, to a tenth of a pixel. Scale 1 returns `font` itself. */
export function scaledFont(scale: number): Font {
  if (scale === 1) return font;
  return Object.fromEntries(Object.entries(font).map(([k, v]) => [k, Math.round(v * scale * 10) / 10])) as Font;
}
export const size = {
  /** A border or a rule. */
  hairline: 1,
  dot: 9,
  spinner: 13,
  spinnerCore: 5,
  /** The value between a stepper's buttons. */
  stepperValue: 46,
  spinnerRing: 1.5,
  /** A stepper's round - and + buttons. */
  stepButton: 20,
  badge: 18,
  control: 28,
  iconButtonW: 26,
  iconButtonH: 24,
  code: 240,
  swatch: 26,
  menuWidth: 216,
  menuRow: 34,
  optionsWidth: 270,
  /** The chat's visible height inside a full card. */
  chat: 375,
  /** Room under the chat's last line, so the end of the chat is plain to see. */
  chatEnd: 36,
  /** The chat's top and bottom fades. */
  fade: 36,
  /** The message box: its minimum height, which is also the send button's diameter. */
  input: 34,
  inputLine: 18,
  inputPad: 7,
  inputLines: 10,
  /** Space between the send button and the card's edge. */
  composerInset: 12,
  /** A folded column's strip, and where its name starts. */
  strip: 46,
  stripTop: 90,
  stripDots: 14,
  /** Space either side of a column's cards. */
  gutter: 14,
  /** A folded column: the row height of one dot, the "+n" line, the name's length range, and room kept under it. */
  stripDotRow: 15,
  stripMore: 16,
  stripLabelMin: 40,
  stripLabelMax: 260,
  stripLabelRoom: 30,
  /** The rotated name's box height. */
  stripLabelHeight: 26,
  /** A column's fade under its header. */
  columnFade: 20,
  /** The color picker's heading row. */
  pickerLabel: 22,
  popoverPad: 4,
  /** A card menu rule: its line plus the space above and below. */
  menuRule: 9,
} as const;
export const motion = { fast: 120, base: 200, shake: 320, settle: 150 } as const;

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

export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const hexParts = (color: string): [number, number, number] | null => {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return null;
  const n = parseInt(hex[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** `from` moved `amount` (0..1) of the way toward `to`. A color that is not `#rrggbb` leaves `from` unchanged. */
export function mix(from: string, to: string, amount: number): string {
  const a = hexParts(from);
  const b = hexParts(to);
  if (!a || !b) return from;
  const t = Math.min(1, Math.max(0, amount));
  return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Whether `color` (`#rrggbb`) is dark. Unreadable colors count as dark. */
export function isDark(color: string): boolean {
  const c = hexParts(color);
  return c ? (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 < 0.5 : true;
}

/** How far the chat's background sits from the card color toward the page color. */
export const CHAT_BG_MIX = 0.5;
/** The chat area: a few points off the card color, in light or dark. */
export const chatBackground = (p: Palette) => mix(p.card, p.bg, CHAT_BG_MIX);

/** A faint glow just inside a card's outline, in the outline's color (web box-shadow). */
export const innerGlow = (color: string) => `inset 0 0 8px 0 ${tint(color, 0.13)}`;
/** A faint glow around the focused message box and send button. */
export const outerGlow = (color: string) => `0 0 7px 0 ${tint(color, 0.2)}`;

/** `color` at the edge, fading to nothing over `steps` bands: the fallback where a CSS gradient is unavailable. */
export function fadeBands(color: string, steps: number): string[] | null {
  if (!hexParts(color)) return null;
  return Array.from({ length: steps }, (_, i) => tint(color, 0.92 * (1 - i / steps)));
}

/** Text that sits over the chat reads through a strong halo in the card color. Web stacks layers of rising blur, since one shadow is too thin; native takes the single shadow. */
export function halo(card: string, web: boolean): { textShadow?: string; textShadowColor?: string; textShadowRadius?: number; textShadowOffset?: { width: number; height: number } } {
  const solid = tint(card, 1);
  // On web, RN-web folds the textShadow* props into one `textShadow`, so give it one or the other.
  if (web) return { textShadow: [2, 4, 7, 11, 16].map((r) => `0 0 ${r}px ${solid}`).join(", ") };
  return { textShadowColor: solid, textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } };
}

/** The attribute `TokensProvider` puts on the plugin's tree (as `dataSet.metaPaseo`), so the scrollbar style below reaches nothing outside it. */
const SCOPE_ATTR = "data-meta-paseo";
/** Web only: a thin, faint scrollbar line in place of the default bar. Chromium takes the pseudo-elements; Firefox the standard properties. */
export function scrollbarCss(p: Palette): string {
  const thumb = tint(p.muted, 0.35);
  const s = `[${SCOPE_ATTR}]`;
  return [
    `${s} *::-webkit-scrollbar { width: 5px; height: 5px; background: transparent; }`,
    `${s} *::-webkit-scrollbar-track, ${s} *::-webkit-scrollbar-corner { background: transparent; }`,
    `${s} *::-webkit-scrollbar-thumb { background: ${thumb}; border-radius: 3px; }`,
    `${s} *::-webkit-scrollbar-thumb:hover { background: ${tint(p.muted, 0.6)}; }`,
    `@supports not selector(::-webkit-scrollbar) { ${s} * { scrollbar-width: thin; scrollbar-color: ${thumb} transparent; } }`,
  ].join("\n");
}
