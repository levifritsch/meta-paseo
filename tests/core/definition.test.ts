import { describe, expect, it } from "vitest";
import { BY_STATUS, BY_WORKSPACE, DEFAULT_DEF, parseBoardDef } from "../../shared/core";

describe("parseBoardDef", () => {
  it("accepts both presets", () => {
    expect(parseBoardDef(BY_WORKSPACE).ok).toBe(true);
    expect(parseBoardDef(BY_STATUS).ok).toBe(true);
  });
  it("falls back to the default and keeps the original on invalid input (invariant 8)", () => {
    const raw = { version: 1, columns: "nope" };
    const r = parseBoardDef(raw);
    expect(r).toMatchObject({ ok: false, original: raw });
    expect(r.def).toBe(DEFAULT_DEF);
  });
  it("falls back on a newer version", () => {
    expect(parseBoardDef({ ...BY_STATUS, version: 2 }).ok).toBe(false);
  });
  it("rejects duplicate and reserved column ids", () => {
    const col = { kind: "rule" as const, id: "x", title: "X", match: {} };
    expect(parseBoardDef({ ...BY_STATUS, columns: [col, col] }).ok).toBe(false);
    expect(parseBoardDef({ ...BY_STATUS, columns: [{ ...col, id: "other" }] }).ok).toBe(false);
  });
});

describe("parseBoardDef: stored and view", () => {
  it("treats nothing stored as the default, not as a bad record", () => {
    expect(parseBoardDef(undefined)).toEqual({ def: DEFAULT_DEF, ok: true });
    expect(parseBoardDef({})).toEqual({ def: DEFAULT_DEF, ok: true });
  });
  it("fills a missing view with the default", () => {
    const { view: _view, ...noView } = BY_STATUS;
    const r = parseBoardDef(noView);
    expect(r.ok).toBe(true);
    expect(r.def.view).toEqual({ columnWidth: 360, fontScale: 1 });
  });
  it("resets an out-of-range view value without rejecting the definition", () => {
    const r = parseBoardDef({ ...BY_STATUS, view: { columnWidth: 400, fontScale: 9 } });
    expect(r.ok).toBe(true);
    expect(r.def.view).toEqual({ columnWidth: 400, fontScale: 1 });
  });
});
