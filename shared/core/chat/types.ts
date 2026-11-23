// Chat domain types. Paseo's timeline is mapped into these by client/data; core never sees its types.

export type ToolStatus = "running" | "completed" | "failed" | "canceled";

export type ToolDetail =
  | { type: "shell"; command: string; output?: string }
  | { type: "edit"; filePath: string; diff?: string }
  | { type: "write"; filePath: string; content?: string }
  | { type: "read"; filePath: string }
  | { type: "other"; label: string };

export type ChatBlock =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; text: string }
  | { kind: "reasoning"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; status: ToolStatus; detail: ToolDetail }
  | { kind: "todo"; id: string; items: { text: string; done: boolean }[] }
  | { kind: "notice"; id: string; level: "info" | "warning" | "error"; message: string }
  | { kind: "error"; id: string; message: string };

/** One timeline entry. `turnId` is absent on older hosts. */
export type ChatEntry = { turnId?: string; timestamp: number; block: ChatBlock };

export type Turn = { id: string; turnId?: string; blocks: ChatBlock[]; startedAt: number };

export type Action = { id: string; label: string; behavior: "allow" | "deny"; variant?: "primary" | "secondary" | "danger" };

export type Question = {
  prompt: string;
  header?: string;
  multiSelect: boolean;
  options: { label: string; description?: string }[];
};

/** Something waiting on the user. Rendered by kind through a registry. */
export type Request =
  | { kind: "question"; id: string; questions: Question[] }
  | { kind: "plan"; id: string; title?: string; text: string; actions: Action[] }
  | { kind: "permission"; id: string; title: string; description?: string; code?: string; actions: Action[] }
  | { kind: "other"; id: string; title: string; description?: string; actions: Action[] };

export type RequestKind = Request["kind"];

/** Per question: the options picked and the free-text answer. */
export type Answer = { picked: string[]; text: string };
