import { describe, expect, it } from "vitest";
import { createWriteQueue } from "../../client/state/write-queue";

type Doc = Record<string, string>;

function setup(opts: { saveResults?: boolean[] } = {}) {
  const timers: Array<{ fn: () => void; ms: number; live: boolean }> = [];
  const saves: Array<{ values: Doc; revision: string }> = [];
  const errors: Array<string | null> = [];
  let reloads = 0;
  const results = [...(opts.saveResults ?? [])];
  const q = createWriteQueue<Doc>({
    delayMs: 100,
    save: async (values, revision) => {
      saves.push({ values, revision });
      return results.length ? results.shift()! : true;
    },
    reload: async () => void reloads++,
    merge: (base, mine, latest) => {
      const out = { ...latest };
      for (const [k, v] of Object.entries(mine)) if (base[k] !== v) out[k] = v;
      return out;
    },
    onError: (m) => errors.push(m),
    timers: {
      set: (fn, ms) => {
        const t = { fn, ms, live: true };
        timers.push(t);
        return t;
      },
      clear: (h) => void ((h as { live: boolean }).live = false),
    },
  });
  const fire = async () => {
    const t = [...timers].reverse().find((x) => x.live);
    if (!t) return false;
    t.live = false;
    t.fn();
    await Promise.resolve();
    await Promise.resolve();
    return true;
  };
  return { q, saves, errors, fire, reloads: () => reloads, liveTimers: () => timers.filter((t) => t.live).length };
}

describe("write queue", () => {
  it("waits out the delay and merges rapid changes into one save", async () => {
    const { q, saves, fire } = setup();
    q.observe({ a: "1" }, "r1");
    q.change({ a: "1", b: "2" });
    q.change({ a: "1", b: "2", c: "3" });
    expect(saves).toHaveLength(0);
    await fire();
    expect(saves).toEqual([{ values: { a: "1", b: "2", c: "3" }, revision: "r1" }]);
  });
  it("ignores a change that equals the host's copy", () => {
    const { q, liveTimers } = setup();
    q.observe({ a: "1" }, "r1");
    q.change({ a: "1" });
    expect(q.hasPending).toBe(false);
    expect(liveTimers()).toBe(0);
  });
  it("ignores changes before the host's copy is known", () => {
    const { q } = setup();
    q.change({ a: "1" });
    expect(q.hasPending).toBe(false);
  });
  it("does not save again until the host's new revision is observed", async () => {
    const { q, saves, fire } = setup();
    q.observe({}, "r1");
    q.change({ a: "1" });
    await fire();
    q.change({ a: "1", b: "2" }); // typed while waiting for the revision
    expect(await fire()).toBe(true);
    expect(saves).toHaveLength(1);
    q.observe({ a: "1" }, "r2"); // host confirms my first save
    await fire();
    expect(saves).toHaveLength(2);
    expect(saves[1]).toEqual({ values: { a: "1", b: "2" }, revision: "r2" });
  });
  it("on a failed save, reloads and rebases my change onto the host's newer copy", async () => {
    const { q, saves, fire, reloads } = setup({ saveResults: [false] });
    q.observe({ a: "1" }, "r1");
    q.change({ a: "1", mine: "x" });
    await fire(); // conflict
    expect(reloads()).toBe(1);
    q.observe({ a: "1", theirs: "y" }, "r2"); // the reload answer
    await fire();
    expect(saves[1]).toEqual({ values: { a: "1", theirs: "y", mine: "x" }, revision: "r2" });
  });
  it("retries on its own if the reload brings nothing new", async () => {
    const { q, saves, fire } = setup({ saveResults: [false] });
    q.observe({}, "r1");
    q.change({ a: "1" });
    await fire();
    await fire();
    expect(saves).toHaveLength(2);
  });
  it("stops and reports after repeated failures, keeping the change pending", async () => {
    const { q, saves, errors, fire } = setup({ saveResults: [false, false, false, false] });
    q.observe({}, "r1");
    q.change({ a: "1" });
    for (let i = 0; i < 5; i++) await fire();
    expect(saves).toHaveLength(3);
    expect(errors.at(-1)).toMatch(/Could not save/);
    expect(q.hasPending).toBe(true);
  });
  it("takes a remote change when nothing is pending", () => {
    const { q, liveTimers } = setup();
    q.observe({ a: "1" }, "r1");
    q.observe({ a: "2" }, "r2");
    expect(q.hasPending).toBe(false);
    expect(liveTimers()).toBe(0);
  });
  it("flush saves at once", async () => {
    const { q, saves } = setup();
    q.observe({}, "r1");
    q.change({ a: "1" });
    await q.flush();
    expect(saves).toHaveLength(1);
  });
  it("does nothing after dispose", async () => {
    const { q, saves, fire } = setup();
    q.observe({}, "r1");
    q.change({ a: "1" });
    q.dispose();
    await fire();
    expect(saves).toHaveLength(0);
  });
});
