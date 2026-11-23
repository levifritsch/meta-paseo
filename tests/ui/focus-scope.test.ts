import { describe, expect, it } from "vitest";
import { createFocusTracker } from "../../client/ui/behaviors/focus-scope";

function setup() {
  const queue: Array<() => void> = [];
  const log: boolean[] = [];
  const tracker = createFocusTracker((v) => log.push(v), (f) => queue.push(f));
  const flush = () => queue.splice(0).forEach((f) => f());
  return { tracker, log, flush };
}

describe("focus tracker", () => {
  it("is inside while any source holds focus", () => {
    const { tracker, log, flush } = setup();
    tracker.enter("a");
    tracker.enter("b");
    tracker.leave("a");
    flush();
    expect(tracker.inside).toBe(true);
    tracker.leave("b");
    flush();
    expect(tracker.inside).toBe(false);
    expect(log).toEqual([true, false]);
  });
  it("does not flicker when focus moves between inputs under one source", () => {
    const { tracker, log, flush } = setup();
    tracker.enter("web");
    tracker.leave("web"); // blur of the first input
    tracker.enter("web"); // focus of the second, before the deferred leave runs
    flush();
    expect(tracker.inside).toBe(true);
    expect(log).toEqual([true]);
  });
  it("ignores a leave for a source that never entered", () => {
    const { tracker, log, flush } = setup();
    tracker.leave("x");
    flush();
    expect(log).toEqual([]);
  });
});
