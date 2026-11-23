import type { PluginTheme } from "@getpaseo/plugin";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { palette, type Palette } from "./tokens";

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
