import type { PluginTheme } from "@getpaseo/plugin";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { font, palette, scaledFont, type Font, type Palette } from "./tokens";

const Ctx = createContext<Palette | null>(null);

/** Screens receive `theme` as a prop and wrap their tree in this once. */
export function TokensProvider({ theme, children }: { theme: PluginTheme; children: ReactNode }) {
  const p = useMemo(() => palette(theme), [theme]);
  return <Ctx.Provider value={p}>{children}</Ctx.Provider>;
}

export function usePalette(): Palette {
  const p = useContext(Ctx);
  if (!p) throw new Error("usePalette needs a TokensProvider above it");
  return p;
}

const FontCtx = createContext<{ scale: number; font: Font }>({ scale: 1, font });

/** Wrap the card area. Anything outside it (top bar, headers) keeps the unscaled sizes. */
export function FontScaleProvider({ scale, children }: { scale: number; children: ReactNode }) {
  const value = useMemo(() => ({ scale, font: scaledFont(scale) }), [scale]);
  return <FontCtx.Provider value={value}>{children}</FontCtx.Provider>;
}

/** Type sizes for the current scale. Unscaled when no provider sits above. */
export function useFont(): Font {
  return useContext(FontCtx).font;
}

/** The scale itself, for things that scale without a font size (a Markdown reply). */
export function useFontScale(): number {
  return useContext(FontCtx).scale;
}
