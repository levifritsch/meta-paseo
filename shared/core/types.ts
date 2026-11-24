// Pure domain types. No React, no daemon. See docs/board-definition.md.

export const CARD_STATES = ["needs", "permission", "running", "done", "failed"] as const;
export type CardState = (typeof CARD_STATES)[number];

export type Card = {
  id: string;
  state: CardState;
  workspace: string;
  project?: string;
  model?: string;
  title: string;
  lastActivity: number;
  waitingSince?: number;
  color?: string;
  hasSubAgents?: boolean;
};

export type Rule = {
  state?: CardState;
  workspace?: string;
  project?: string;
  model?: string;
  hasSubAgents?: boolean;
  idleOver?: number;
  not?: Rule;
  any?: Rule[];
};

export type Section = { id: string; label: string };
export type RuleColumn = { kind: "rule"; id: string; title: string; match: Rule; sections?: string[] };
export type WorkspaceColumns = { kind: "workspaces"; sections?: string[] };
export type SortKey = "activity" | "title" | "color" | "waitingSince";
export type SortSpec = { by: SortKey; dir: "asc" | "desc" };

/** Per-client layout state. Workspace column ids are `ws:<workspaceId>`. */
export type BoardState = { folded: Record<string, boolean>; workspaceOrder: string[] };

/** How the board looks on this client. Card text scales; the top bar and headers do not. */
export type BoardView = { columnWidth: number; fontScale: number };
/** The one home for the view options' range and step: the schema, the steppers and the tests read it. */
export const VIEW_LIMITS = { columnWidth: { min: 240, max: 720, step: 40 }, fontScale: { min: 0.8, max: 1.5, step: 0.1 } } as const;
export const DEFAULT_VIEW: BoardView = { columnWidth: 360, fontScale: 1 };

export type BoardDef = {
  version: 1;
  columns: (RuleColumn | WorkspaceColumns)[];
  sections: Section[];
  /** State to section id. Used by columns that declare sections. */
  buckets: Partial<Record<CardState, string>>;
  sort: SortSpec[];
  state: BoardState;
  view: BoardView;
};

export type Workspace = { id: string; name: string };

/** A hand-collapse, keyed by session. Valid while the card stays in `state`. */
export type Collapse = { state: CardState; activity: number };

export type Snapshot = {
  cards: Card[];
  /** `loaded` is false until a fetch succeeds, so a failed load never prunes. */
  workspaces: { loaded: boolean; list: Workspace[] };
  now: number;
  collapsed: Record<string, Collapse>;
  /** Cards the user expanded by hand. */
  expanded: ReadonlySet<string>;
};

export const OTHER_COLUMN_ID = "other";
export const workspaceColumnId = (workspaceId: string) => `ws:${workspaceId}`;

export type PlacedCard = { id: string; expanded: boolean };
export type LayoutSection = { id: string; label?: string; cards: PlacedCard[] };
export type LayoutColumn = {
  id: string;
  title: string;
  generated: boolean;
  folded: boolean;
  count: number;
  sections: LayoutSection[];
};
export type Layout = {
  /** Identity of the column rules; a change resets placement and silences events. */
  defKey: string;
  columns: LayoutColumn[];
  states: Record<string, CardState>;
};

export type BoardEvent = { type: "shake"; columnId: string };
export type BoardResult = { layout: Layout; events: BoardEvent[]; state: BoardState };
