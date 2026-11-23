import type { Card, Rule } from "./types";

export function matches(rule: Rule, card: Card, now: number): boolean {
  if (rule.state !== undefined && rule.state !== card.state) return false;
  if (rule.workspace !== undefined && rule.workspace !== card.workspace) return false;
  if (rule.project !== undefined && rule.project !== card.project) return false;
  if (rule.model !== undefined && rule.model !== card.model) return false;
  if (rule.hasSubAgents !== undefined && rule.hasSubAgents !== Boolean(card.hasSubAgents)) return false;
  if (rule.idleOver !== undefined && now - card.lastActivity <= rule.idleOver) return false;
  if (rule.not && matches(rule.not, card, now)) return false;
  if (rule.any && !rule.any.some((r) => matches(r, card, now))) return false;
  return true;
}
