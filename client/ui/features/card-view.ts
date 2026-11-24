// Pure helpers for how a card reads. No React, no Paseo types.

/** "now", "5m", "3h", "2d": the age of `then` as of `now`. A future time reads as now. */
export function ageLabel(then: number, now: number): string {
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Tokens as "820" or "145.2k" or "1.2M". Null when unknown. */
export function tokenLabel(tokens: number | undefined): string | null {
  if (tokens === undefined) return null;
  if (tokens < 1000) return `${Math.round(tokens)}`;
  if (tokens < 999_950) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}
/** "2 sub-agents · 1 background task", or null when there are none. */
export function helperSummary(subAgents: number, backgroundTasks: number): string | null {
  const parts: string[] = [];
  if (subAgents > 0) parts.push(`${subAgents} sub-agent${subAgents === 1 ? "" : "s"}`);
  if (backgroundTasks > 0) parts.push(`${backgroundTasks} background task${backgroundTasks === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : null;
}

export type StateName = "needs" | "permission" | "running" | "done" | "failed";
export const STATE_LABEL: Record<StateName, string> = { needs: "Needs you", permission: "Permission", running: "Running", done: "Done", failed: "Error" };

/** The compact card's status line: the state and how long ago, e.g. "Running · 5m". */
export const compactMeta = (state: StateName, ago: string): string => `${STATE_LABEL[state]} · ${ago}`;

/** "workspace · 5m": the full card's line under the title. Empty parts drop out. */
export const joinMeta = (...parts: (string | null | undefined | false)[]): string => parts.filter(Boolean).join(" · ");
