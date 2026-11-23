import { describe, expect, it } from "vitest";
import { EMPTY_SESSIONS, mergeRecord, mergeSessions, parseSessions, type BoardSessions } from "../../shared/core";

const rec = (colors: Record<string, string>, collapsed: BoardSessions["collapsed"] = {}): BoardSessions => ({ version: 1, colors, collapsed });

describe("parseSessions", () => {
  it("treats nothing stored as empty", () => {
    expect(parseSessions(undefined)).toEqual({ value: EMPTY_SESSIONS, ok: true });
    expect(parseSessions({})).toEqual({ value: EMPTY_SESSIONS, ok: true });
  });
  it("accepts a valid record", () => {
    const raw = rec({ s1: "red" }, { s2: { state: "done", activity: 5 } });
    expect(parseSessions(raw)).toEqual({ value: raw, ok: true });
  });
  it("falls back and keeps the original for invalid or newer-version input (invariant 8)", () => {
    for (const raw of [{ version: 1, colors: 3 }, { ...rec({}), version: 2 }, { version: 1, colors: {}, collapsed: { s: { state: "bogus", activity: 1 } } }]) {
      expect(parseSessions(raw)).toMatchObject({ ok: false, original: raw, value: EMPTY_SESSIONS });
    }
  });
});

describe("mergeRecord", () => {
  it("applies only what this client changed onto what the host holds now", () => {
    const base = { a: "1", b: "2" };
    const mine = { a: "1", b: "2", c: "3" }; // I added c
    const latest = { a: "1", b: "2", d: "4" }; // someone else added d
    expect(mergeRecord(base, mine, latest)).toEqual({ a: "1", b: "2", c: "3", d: "4" });
  });
  it("keeps my change when we both changed a key, and my removal", () => {
    expect(mergeRecord({ a: "1" }, { a: "mine" }, { a: "theirs" })).toEqual({ a: "mine" });
    expect(mergeRecord({ a: "1", b: "2" }, { b: "2" }, { a: "1", b: "2", c: "3" })).toEqual({ b: "2", c: "3" });
  });
  it("leaves keys I did not touch as the host has them", () => {
    expect(mergeRecord({ a: "1" }, { a: "1" }, { a: "other" })).toEqual({ a: "other" });
  });
  it("merges both maps of a sessions record", () => {
    const base = rec({ a: "red" });
    const mine = rec({ a: "red", b: "blue" }, { x: { state: "done", activity: 1 } });
    const latest = rec({ a: "red", c: "pink" });
    expect(mergeSessions(base, mine, latest)).toEqual(rec({ a: "red", b: "blue", c: "pink" }, { x: { state: "done", activity: 1 } }));
  });
});
