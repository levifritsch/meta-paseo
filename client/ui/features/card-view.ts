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

/** Context use as a whole percent, or null when unknown. */
export const contextPercent = (use: number | undefined): number | null => (use === undefined ? null : Math.round(use * 100));

/** "2 sub-agents · 1 background task", or null when there are none. */
export function helperSummary(subAgents: number, backgroundTasks: number): string | null {
  const parts: string[] = [];
  if (subAgents > 0) parts.push(`${subAgents} sub-agent${subAgents === 1 ? "" : "s"}`);
  if (backgroundTasks > 0) parts.push(`${backgroundTasks} background task${backgroundTasks === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : null;
}
