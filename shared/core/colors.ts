// Session colors (P1 to P3): pure. Randomness is injected so tests are deterministic.

export type PaletteEntry = { id: string; auto: boolean };
export type Rand = () => number;

const usage = (palette: readonly PaletteEntry[], colors: Readonly<Record<string, string>>) => {
  const counts = new Map(palette.map((p) => [p.id, 0]));
  for (const id of Object.values(colors)) if (counts.has(id)) counts.set(id, counts.get(id)! + 1);
  return counts;
};

/** P1: a random color among the least used. White and gray (`auto: false`) are never picked. */
export function pickColor(palette: readonly PaletteEntry[], colors: Readonly<Record<string, string>>, rand: Rand): string {
  const candidates = palette.filter((p) => p.auto);
  if (candidates.length === 0) throw new Error("palette has no automatic colors");
  const counts = usage(palette, colors);
  const least = Math.min(...candidates.map((c) => counts.get(c.id)!));
  const pool = candidates.filter((c) => counts.get(c.id) === least);
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]!.id;
}

export type Colorable = { id: string; createdAt: number };

/**
 * P2, P3: give every session without a color one, oldest first so a first load spreads them. Colors
 * already stored are kept. Returns the same object when nothing changes.
 */
export function assignColors(
  palette: readonly PaletteEntry[],
  colors: Readonly<Record<string, string>>,
  sessions: readonly Colorable[],
  rand: Rand,
): Record<string, string> {
  const missing = sessions.filter((s) => !(s.id in colors)).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  if (missing.length === 0) return colors as Record<string, string>;
  const next = { ...colors };
  for (const s of missing) next[s.id] = pickColor(palette, next, rand);
  return next;
}

/** Drop entries of sessions that are gone. Never before a successful load (invariant 9). */
export function pruneBySession<V>(byId: Readonly<Record<string, V>>, liveIds: ReadonlySet<string>, loaded: boolean): Record<string, V> {
  if (!loaded) return byId as Record<string, V>;
  const entries = Object.entries(byId).filter(([id]) => liveIds.has(id));
  return entries.length === Object.keys(byId).length ? (byId as Record<string, V>) : Object.fromEntries(entries);
}
export const pruneColors = pruneBySession<string>;
