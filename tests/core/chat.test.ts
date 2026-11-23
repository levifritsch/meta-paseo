import { describe, expect, it } from "vitest";
import {
  answerTexts, buildTurns, emptyAnswer, foldCode, groupBlocks, isComplete, latestReply, selectCustom, setCustomText, shouldAdvance, summarizeTool, togglePick,
  type ChatBlock, type ChatEntry, type Question,
} from "../../shared/core";

const user = (id: string): ChatBlock => ({ kind: "user", id, text: id });
const asst = (id: string): ChatBlock => ({ kind: "assistant", id, text: id });
const entry = (block: ChatBlock, turnId?: string): ChatEntry => ({ block, turnId, timestamp: 0 });

describe("buildTurns", () => {
  it("groups by turn id", () => {
    const turns = buildTurns([entry(user("u1"), "t1"), entry(asst("a1"), "t1"), entry(user("u2"), "t2"), entry(asst("a2"), "t2")]);
    expect(turns.map((t) => t.blocks.map((b) => b.id))).toEqual([["u1", "a1"], ["u2", "a2"]]);
  });
  it("lets a steering message join the running turn", () => {
    const turns = buildTurns([entry(user("u1"), "t1"), entry(asst("a1"), "t1"), entry(user("steer"), "t1")]);
    expect(turns).toHaveLength(1);
  });
  it("falls back to user messages without turn ids", () => {
    const turns = buildTurns([entry(user("u1")), entry(asst("a1")), entry(user("u2")), entry(user("u3")), entry(asst("a2"))]);
    expect(turns.map((t) => t.blocks.map((b) => b.id))).toEqual([["u1", "a1"], ["u2", "u3", "a2"]]);
  });
  it("is empty for no entries", () => {
    expect(buildTurns([])).toEqual([]);
  });
});

describe("latestReply", () => {
  it("is the last assistant block of the last turn, or null before a reply", () => {
    expect(latestReply(buildTurns([entry(user("u"), "t"), entry(asst("a1"), "t"), entry(asst("a2"), "t")]))?.id).toBe("a2");
    expect(latestReply(buildTurns([entry(user("u"), "t")]))).toBeNull();
  });
});

describe("summarizeTool", () => {
  it("uses the first command line, the file, or the label", () => {
    expect(summarizeTool({ type: "shell", command: "ls\nwc" }, "Bash")).toBe("ls");
    expect(summarizeTool({ type: "edit", filePath: "a.ts" }, "Edit")).toBe("a.ts");
    expect(summarizeTool({ type: "other", label: "" }, "Task")).toBe("Task");
  });
});

describe("foldCode", () => {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `l${i + 1}`).join("\n");
  it("shows up to 10 lines whole", () => {
    expect(foldCode(lines(10))).toMatchObject({ hiddenLines: 0, foldable: false });
  });
  it("folds longer code to its first 5 lines", () => {
    const r = foldCode(lines(11));
    expect(r.shown).toBe(lines(5));
    expect(r).toMatchObject({ hiddenLines: 6, foldable: true });
  });
  it("shows it all once expanded, and stays foldable", () => {
    expect(foldCode(lines(11), true)).toMatchObject({ shown: lines(11), hiddenLines: 0, foldable: true });
  });
  it("counts lines as written", () => {
    expect(foldCode("x".repeat(500)).foldable).toBe(false);
  });
});

describe("answers", () => {
  const single: Question = { prompt: "Which?", multiSelect: false, options: [{ label: "A" }, { label: "B" }] };
  const multi: Question = { prompt: "Which all?", multiSelect: true, options: [{ label: "A" }, { label: "B" }] };
  it("holds one pick for single-select, and toggles it off", () => {
    let a = togglePick(single, emptyAnswer(), "A");
    a = togglePick(single, a, "B");
    expect(a.picked).toEqual(["B"]);
    expect(togglePick(single, a, "B").picked).toEqual([]);
  });
  it("holds many picks for multi-select", () => {
    let a = togglePick(multi, emptyAnswer(), "A");
    a = togglePick(multi, a, "B");
    expect(a.picked).toEqual(["A", "B"]);
  });
  it("makes picks and the text box exclusive, and keeps the text", () => {
    let a = setCustomText(togglePick(single, emptyAnswer(), "A"), "my own");
    expect(a).toEqual({ picked: [], text: "my own", custom: true });
    a = togglePick(single, a, "B");
    expect(a).toEqual({ picked: ["B"], text: "my own", custom: false });
    a = selectCustom(a);
    expect(a).toEqual({ picked: [], text: "my own", custom: true });
  });
  it("is complete only when every question has a pick, or text in the selected box", () => {
    const qs = [single, multi];
    const pick = togglePick(single, emptyAnswer(), "A");
    expect(isComplete(qs, [pick])).toBe(false);
    expect(isComplete(qs, [pick, selectCustom(emptyAnswer())])).toBe(false);
    expect(isComplete(qs, [pick, setCustomText(emptyAnswer(), "other")])).toBe(true);
    expect(isComplete(qs, [pick, { picked: ["A"], text: "ignored", custom: false }])).toBe(true);
    expect(isComplete([], [])).toBe(false);
  });
  it("ignores kept text while an option is picked", () => {
    expect(answerTexts([multi], [{ picked: ["A", "B"], text: "kept", custom: false }])).toEqual({ "Which all?": "A, B" });
    expect(answerTexts([multi], [{ picked: [], text: " mine ", custom: true }])).toEqual({ "Which all?": "mine" });
  });
  it("advances after a new single-select pick, but not on unpick, multi-select, text, or the last question", () => {
    const none = emptyAnswer();
    const a = togglePick(single, none, "A");
    expect(shouldAdvance(single, none, a, false)).toBe(true);
    expect(shouldAdvance(single, a, togglePick(single, a, "A"), false)).toBe(false);
    expect(shouldAdvance(single, a, togglePick(single, a, "B"), false)).toBe(true);
    expect(shouldAdvance(multi, none, togglePick(multi, none, "A"), false)).toBe(false);
    expect(shouldAdvance(single, none, setCustomText(none, "x"), false)).toBe(false);
    expect(shouldAdvance(single, none, a, true)).toBe(false);
  });
});

describe("groupBlocks", () => {
  const tool = (id: string): ChatBlock => ({ kind: "tool", id, name: "Bash", status: "completed", detail: { type: "other", label: id } });
  const think = (id: string): ChatBlock => ({ kind: "reasoning", id, text: id });
  it("groups an unbroken run of tools and thinking, and sets prompts and replies apart", () => {
    const g = groupBlocks([user("u"), think("t1"), tool("c1"), tool("c2"), asst("a1"), tool("c3"), asst("a2")]);
    expect(g.map((x) => [x.kind, x.blocks.map((b) => b.id)])).toEqual([
      ["user", ["u"]], ["work", ["t1", "c1", "c2"]], ["reply", ["a1"]], ["work", ["c3"]], ["reply", ["a2"]],
    ]);
  });
  it("keeps each reply and each error on its own", () => {
    expect(groupBlocks([asst("a1"), asst("a2"), { kind: "error", id: "e", message: "x" }]).map((x) => x.kind)).toEqual(["reply", "reply", "note"]);
  });
});
