// Pure domain types. No React, no daemon. See docs/board-definition.md.

export type CardState = "needs" | "permission" | "running" | "idle" | "failed";

export type Card = {
  id: string;
  state: CardState;
  workspace: string;
  title: string;
  lastActivity: number;
};

export type Rule = {
  state?: CardState;
  workspace?: string;
  not?: Rule;
  any?: Rule[];
};

export type RuleColumn = { kind: "rule"; id: string; title: string; match: Rule };

export type BoardDef = {
  version: 1;
  columns: RuleColumn[];
};

export const OTHER_COLUMN_ID = "other";

export type Layout = { columns: { id: string; title: string; cardIds: string[] }[] };
