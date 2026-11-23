import { describe, expect, it } from "vitest";
import { mapBoard, mapWorkspaces, PARENT_AGENT_LABEL } from "../../client/data/card-map";
import type { PaseoAgent } from "../../client/data/paseo-types";

const agent = (over: Record<string, unknown> = {}): PaseoAgent =>
  ({
    id: "a1",
    cwd: "/repo",
    workspaceId: "w1",
    model: "opus",
    title: "Fix bug",
    updatedAt: "2026-11-23T10:00:00.000Z",
    status: "idle",
    pendingPermissions: [],
    labels: {},
    ...over,
  }) as unknown as PaseoAgent;
const request = (kind: string) => ({ id: "r", kind, name: "x" });
const ws = [{ id: "w1", name: "main", projectDisplayName: "meta-paseo" }];
const one = (over: Record<string, unknown>, others: PaseoAgent[] = []) => {
  const board = mapBoard([agent(over), ...others], ws);
  return board.cards.find((c) => c.id === "a1")!;
};

describe("session to card state", () => {
  it.each(["tool", "plan", "mode", "other"])("a pending %s request is permission", (kind) => {
    expect(one({ pendingPermissions: [request(kind)] }).state).toBe("permission");
  });
  it("a pending question is needs", () => {
    expect(one({ pendingPermissions: [request("question")] }).state).toBe("needs");
  });
  it("permission outranks a question", () => {
    expect(one({ pendingPermissions: [request("question"), request("tool")] }).state).toBe("permission");
  });
  it("status error, or attention reason error, is failed", () => {
    expect(one({ status: "error" }).state).toBe("failed");
    expect(one({ attentionReason: "error" }).state).toBe("failed");
  });
  it("a running or starting session is running", () => {
    expect(one({ status: "running" }).state).toBe("running");
    expect(one({ status: "initializing" }).state).toBe("running");
  });
  it("C1: a finished turn with a sub-agent still working is running", () => {
    const child = agent({ id: "c1", status: "running", labels: { [PARENT_AGENT_LABEL]: "a1" } });
    expect(one({}, [child]).state).toBe("running");
  });
  it("C1: a finished turn with a background task still working is running", () => {
    expect(one({ backgroundWork: { count: 1, runningCount: 1 } }).state).toBe("running");
  });
  it("a finished turn with finished helpers is done", () => {
    const child = agent({ id: "c1", status: "idle", labels: { [PARENT_AGENT_LABEL]: "a1" } });
    expect(one({ backgroundWork: { count: 1, runningCount: 0 } }, [child]).state).toBe("done");
  });
  it("anything else idle is done", () => {
    expect(one({}).state).toBe("done");
    expect(one({ status: "closed" }).state).toBe("done");
  });
});

describe("card fields", () => {
  it("carries title, model, workspace, project and activity time", () => {
    expect(one({})).toMatchObject({
      title: "Fix bug",
      model: "opus",
      workspace: "w1",
      project: "meta-paseo",
      lastActivity: Date.parse("2026-11-23T10:00:00.000Z"),
    });
  });
  it("names an untitled session, and falls back to cwd without a workspace", () => {
    expect(one({ title: null }).title).toBe("New session");
    expect(one({ workspaceId: undefined }).workspace).toBe("/repo");
  });
  it("waitingSince is set only while the session waits on you", () => {
    expect(one({ pendingPermissions: [request("tool")], attentionTimestamp: "2026-11-23T09:00:00.000Z" }).waitingSince).toBe(
      Date.parse("2026-11-23T09:00:00.000Z"),
    );
    expect(one({ status: "error" }).waitingSince).toBe(Date.parse("2026-11-23T10:00:00.000Z"));
    expect(one({}).waitingSince).toBeUndefined();
  });
});

describe("exclusions", () => {
  const kid = (extra: Record<string, unknown>) => agent({ id: "k", labels: {}, ...extra });
  it("C2: sub-agent and background sessions get no card", () => {
    const board = mapBoard([agent(), kid({ labels: { [PARENT_AGENT_LABEL]: "a1" } }), kid({ id: "b", background: true })], ws);
    expect(board.cards.map((c) => c.id)).toEqual(["a1"]);
    expect(board.hidden.map((h) => [h.id, h.kind])).toEqual([["k", "sub-agent"], ["b", "background"]]);
  });
  it("C3: internal sessions get no card", () => {
    const board = mapBoard([agent(), kid({ id: "i", internal: true })], ws);
    expect(board.cards.map((c) => c.id)).toEqual(["a1"]);
    expect(board.hidden[0]).toMatchObject({ id: "i", kind: "internal" });
  });
  it("archived sessions get no card and are not counted", () => {
    const board = mapBoard([agent({ archivedAt: "2026-11-22T00:00:00.000Z" })], ws);
    expect(board.cards).toEqual([]);
    expect(board.hidden).toEqual([]);
  });
  it("hidden sessions keep their requests and parent for the queue", () => {
    const child = kid({ labels: { [PARENT_AGENT_LABEL]: "a1" }, pendingPermissions: [request("tool")] });
    const [h] = mapBoard([agent(), child], ws).hidden;
    expect(h).toMatchObject({ parentId: "a1" });
    expect(h!.requests).toHaveLength(1);
  });
  it("counts go on the parent", () => {
    const child = kid({ labels: { [PARENT_AGENT_LABEL]: "a1" } });
    const board = mapBoard([agent({ backgroundWork: { count: 2, runningCount: 0 } }), child], ws);
    expect(board.extras["a1"]).toEqual({ subAgents: 1, backgroundTasks: 2 });
    expect(board.cards[0]!.hasSubAgents).toBe(true);
  });
});

describe("workspaces", () => {
  it("drops internal, background and archiving workspaces, and prefers the title", () => {
    const list = mapWorkspaces([
      { id: "1", name: "a", title: "Alpha" },
      { id: "2", name: "b", internal: true },
      { id: "3", name: "c", background: true },
      { id: "4", name: "d", archivingAt: "2026-11-23T00:00:00.000Z" },
      { id: "5", name: "e", title: " " },
    ]);
    expect(list).toEqual([
      { id: "1", name: "Alpha" },
      { id: "5", name: "e" },
    ]);
  });
});
