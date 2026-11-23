import { describe, expect, it } from "vitest";
import type { PermissionRequest as AgentPermissionRequest } from "../../client/data/paseo-types";
import { actionResponse, mapEntry, mapRequest, questionResponse } from "../../client/data/chat-map";
import { createBoardStore, setDraft } from "../../client/state/store";

const base = { provider: "claude" } as const;
const req = (over: Partial<AgentPermissionRequest>): AgentPermissionRequest => ({ id: "r1", name: "Bash", kind: "tool", ...base, ...over }) as AgentPermissionRequest;

describe("mapEntry", () => {
  const at = { timestamp: "2026-11-23T10:00:00Z", seqStart: 7 };
  it("maps messages, tools and errors", () => {
    expect(mapEntry({ ...at, turnId: "t", item: { type: "assistant_message", text: "hi" } })?.block).toMatchObject({ kind: "assistant", text: "hi", id: "assistant:7" });
    const tool = mapEntry({ ...at, item: { type: "tool_call", callId: "c1", name: "Bash", status: "running", error: null, detail: { type: "shell", command: "ls" } } });
    expect(tool?.block).toMatchObject({ kind: "tool", id: "c1", status: "running", detail: { type: "shell", command: "ls" } });
    expect(mapEntry({ ...at, item: { type: "error", message: "boom" } })?.block).toMatchObject({ kind: "error", message: "boom" });
  });
  it("keeps the turn id and parses the timestamp", () => {
    const e = mapEntry({ ...at, turnId: "t9", item: { type: "user_message", text: "x" } });
    expect(e).toMatchObject({ turnId: "t9", timestamp: Date.parse("2026-11-23T10:00:00Z") });
  });
  it("skips items with no row", () => {
    expect(mapEntry({ ...at, item: { type: "compaction", status: "completed" } })).toBeNull();
  });
});

describe("mapRequest", () => {
  it("maps a permission with its command and default actions", () => {
    const r = mapRequest(req({ detail: { type: "shell", command: "rm -rf x" } }));
    expect(r).toMatchObject({ kind: "permission", code: "rm -rf x" });
    expect(r.kind === "permission" && r.actions.map((a) => a.id)).toEqual(["allow", "deny"]);
  });
  it("maps a question from its input", () => {
    const r = mapRequest(req({ kind: "question", input: { questions: [{ question: "Which?", header: "H", multiSelect: true, options: [{ label: "A", description: "a" }] }] } }));
    expect(r).toMatchObject({ kind: "question", questions: [{ prompt: "Which?", multiSelect: true, options: [{ label: "A" }] }] });
  });
  it("falls back to other for a question it cannot read", () => {
    expect(mapRequest(req({ kind: "question", input: { questions: "nope" } })).kind).toBe("other");
  });
  it("maps a plan", () => {
    expect(mapRequest(req({ kind: "plan", detail: { type: "plan", text: "# Plan" } }))).toMatchObject({ kind: "plan", text: "# Plan" });
  });
});

describe("responses", () => {
  it("allows or denies by the chosen action", () => {
    const raw = req({ actions: [{ id: "a", label: "Yes", behavior: "allow" }, { id: "d", label: "No", behavior: "deny" }] });
    expect(actionResponse(raw, "d")).toEqual({ behavior: "deny", selectedActionId: "d" });
    expect(actionResponse(raw, "a")).toEqual({ behavior: "allow", selectedActionId: "a" });
  });
  it("adds answers to the question's input", () => {
    const raw = req({ kind: "question", input: { questions: [] , keep: 1 } });
    const qs = [{ prompt: "Which?", multiSelect: false, options: [] }];
    expect(questionResponse(raw, qs, [{ picked: ["A"], text: "", custom: false }])).toEqual({
      behavior: "allow",
      updatedInput: { questions: [], keep: 1, answers: { "Which?": "A" } },
    });
  });
});

describe("store", () => {
  it("keeps drafts per session and drops empty ones", () => {
    const store = createBoardStore();
    setDraft(store, "a", "hello");
    setDraft(store, "b", "x");
    setDraft(store, "a", "");
    expect(store.get().drafts).toEqual({ b: "x" });
  });
  it("notifies subscribers only on change", () => {
    const store = createBoardStore();
    let n = 0;
    store.subscribe(() => n++);
    setDraft(store, "a", "x");
    setDraft(store, "a", "x");
    expect(n).toBe(1);
  });
});
