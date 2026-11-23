import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  followReduce,
  followTarget,
  initialFollow,
  latestOnScreen,
  type FollowEvent,
  type FollowState,
} from "../../client/ui/behaviors/follow-scroll";

const run = (events: FollowEvent[], from: FollowState = initialFollow) => {
  let state = from;
  const cmds: (number | null)[] = [];
  for (const e of events) {
    const r = followReduce(state, e);
    state = r.state;
    cmds.push(r.scrollTo);
  }
  return { state, cmds };
};
const layout = (contentHeight: number, replyTop: number | null = null, viewportHeight = 400, replyHeight = 100): FollowEvent => ({
  type: "layout", contentHeight, replyTop, replyHeight: replyTop === null ? null : replyHeight, viewportHeight,
});

describe("follow target", () => {
  it("is the bottom before the turn has a reply", () => {
    expect(followTarget({ replyTop: null, replyHeight: null, contentHeight: 1000, viewportHeight: 400 })).toBe(600);
  });
  it("is the top of the latest reply", () => {
    expect(followTarget({ replyTop: 300, replyHeight: 50, contentHeight: 1000, viewportHeight: 400 })).toBe(300);
  });
  it("clamps to the scroll range", () => {
    expect(followTarget({ replyTop: 900, replyHeight: 50, contentHeight: 1000, viewportHeight: 400 })).toBe(600);
    expect(followTarget({ replyTop: null, replyHeight: 50, contentHeight: 100, viewportHeight: 400 })).toBe(0);
  });
});

describe("follow scroll", () => {
  it("follows the bottom as content grows, then the reply top once it exists", () => {
    const { cmds } = run([layout(1000), layout(1200), layout(1500, 1100)]);
    expect(cmds).toEqual([600, 800, 1100]);
  });
  it("does not treat its own scroll as the user", () => {
    const { state } = run([layout(1000), { type: "scroll", offset: 600 }]);
    expect(state.following).toBe(true);
    expect(state.expected).toBeNull();
  });
  it("detaches when the user scrolls away, and then stops scrolling", () => {
    const { state, cmds } = run([layout(1000), { type: "scroll", offset: 600 }, { type: "scroll", offset: 200 }, layout(1400)]);
    expect(state.following).toBe(false);
    expect(cmds.at(-1)).toBeNull();
  });
  it("re-follows on a new prompt or the jump button", () => {
    const { state, cmds } = run([layout(1000), { type: "scroll", offset: 100 }, layout(1400), { type: "prompt" }]);
    expect(state.following).toBe(true);
    expect(cmds.at(-1)).toBe(1000);
  });
  it("keeps the same row in view when earlier turns are prepended", () => {
    const { state, cmds } = run([layout(1000), { type: "scroll", offset: 100 }, { type: "prepend", addedHeight: 250 }]);
    expect(cmds.at(-1)).toBe(350);
    expect(state.following).toBe(false);
  });
  it("ignores a stray scroll event that lands on the target", () => {
    const { state } = run([layout(1000), { type: "scroll", offset: 600 }, { type: "scroll", offset: 600 }]);
    expect(state.following).toBe(true);
  });
  it("never asks to scroll outside the range, for any event order", () => {
    const eventArb: fc.Arbitrary<FollowEvent> = fc.oneof(
      fc.record({
        type: fc.constant("layout" as const),
        replyTop: fc.option(fc.nat(3000), { nil: null }),
        replyHeight: fc.option(fc.nat(500), { nil: null }),
        contentHeight: fc.nat(3000),
        viewportHeight: fc.integer({ min: 1, max: 800 }),
      }),
      fc.record({ type: fc.constant("scroll" as const), offset: fc.nat(3000) }),
      fc.constant({ type: "prompt" as const }),
    );
    fc.assert(
      fc.property(fc.array(eventArb, { maxLength: 40 }), (events) => {
        let state = initialFollow;
        for (const e of events) {
          const r = followReduce(state, e);
          state = r.state;
          if (r.scrollTo !== null && r.state.following) {
            const max = Math.max(0, state.layout.contentHeight - state.layout.viewportHeight);
            expect(r.scrollTo).toBeGreaterThanOrEqual(0);
            expect(r.scrollTo).toBeLessThanOrEqual(max);
          }
        }
      }),
    );
  });
});

describe("re-attach", () => {
  it("follows again when the user scrolls back to the bottom", () => {
    const { state } = run([layout(1000), { type: "scroll", offset: 100 }, { type: "scroll", offset: 595 }]);
    expect(state.following).toBe(true);
  });
  it("stays detached anywhere above the bottom", () => {
    const { state } = run([layout(1000), { type: "scroll", offset: 100 }, { type: "scroll", offset: 400 }]);
    expect(state.following).toBe(false);
  });
});

describe("tall reply", () => {
  it("follows the bottom, not the reply top, once the user returns to the bottom", () => {
    const { state, cmds } = run([
      layout(2000, 500), // reply top 500, bottom 1600
      { type: "scroll", offset: 200 },
      { type: "scroll", offset: 1600 },
      layout(2100, 500),
    ]);
    expect(state.following).toBe(true);
    expect(state.anchor).toBe("bottom");
    expect(cmds.at(-1)).toBe(1700);
  });
  it("goes back to the reply top on the next prompt", () => {
    const { state, cmds } = run([layout(2000, 500), { type: "scroll", offset: 200 }, { type: "scroll", offset: 1600 }, { type: "prompt" }]);
    expect(state.anchor).toBe("reply");
    expect(cmds.at(-1)).toBe(500);
  });
});

describe("prepend and the reply top", () => {
  it("shifts the reply top by the height added above it", () => {
    const { state } = run([layout(1000, 700), { type: "scroll", offset: 100 }, { type: "prepend", addedHeight: 250 }]);
    expect(state.layout.replyTop).toBe(950);
  });
});

describe("latestOnScreen", () => {
  const at = (offset: number, ...events: FollowEvent[]) => latestOnScreen({ ...run(events).state, offset });
  it("is true while any part of the latest reply is in view", () => {
    expect(at(0, layout(2000, 100, 400, 100))).toBe(true); // reply 100–200, view 0–400
    expect(at(150, layout(2000, 100, 400, 100))).toBe(true); // view 150–550 still shows its end
  });
  it("is false once the reply has scrolled out of view, either way", () => {
    expect(at(300, layout(2000, 100, 400, 100))).toBe(false);
    expect(at(0, layout(2000, 900, 400, 100))).toBe(false);
  });
  it("before a reply, tracks whether the bottom is in view", () => {
    expect(at(1600, layout(2000))).toBe(true);
    expect(at(500, layout(2000))).toBe(false);
  });
});
