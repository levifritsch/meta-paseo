// Headless state machine for a chat that follows its latest reply. No React, no scroll views.
// The view feeds events in and runs the returned scroll command. See docs/behavior-spec.md.

export type FollowLayout = { replyTop: number | null; contentHeight: number; viewportHeight: number };

export type FollowState = {
  following: boolean;
  /** Last known scroll offset. */
  offset: number;
  /** Offset we scrolled to ourselves. The next scroll event at it is an echo, not the user. */
  expected: number | null;
  layout: FollowLayout;
};

export type FollowEvent =
  | ({ type: "layout" } & FollowLayout)
  | { type: "scroll"; offset: number }
  /** A new prompt was sent, or the jump button was pressed. */
  | { type: "prompt" }
  /** "Show earlier" added `addedHeight` above what you were looking at. */
  | { type: "prepend"; addedHeight: number };

export type FollowResult = { state: FollowState; scrollTo: number | null };

export const initialFollow: FollowState = {
  following: true,
  offset: 0,
  expected: null,
  layout: { replyTop: null, contentHeight: 0, viewportHeight: 0 },
};

const EPSILON = 1;
/** Within this many px of the bottom counts as "at the bottom". */
const BOTTOM_SLACK = 8;

const maxOffset = (l: FollowLayout) => Math.max(0, l.contentHeight - l.viewportHeight);

/** Top of the latest reply, or the bottom before the turn has one. Clamped to the scroll range. */
export function followTarget(l: FollowLayout): number {
  const max = maxOffset(l);
  return Math.min(max, Math.max(0, l.replyTop ?? max));
}

function goTo(state: FollowState, y: number): FollowResult {
  if (Math.abs(y - state.offset) <= EPSILON) return { state, scrollTo: null };
  return { state: { ...state, offset: y, expected: y }, scrollTo: y };
}

export function followReduce(state: FollowState, event: FollowEvent): FollowResult {
  switch (event.type) {
    case "layout": {
      const next = { ...state, layout: { replyTop: event.replyTop, contentHeight: event.contentHeight, viewportHeight: event.viewportHeight } };
      return next.following ? goTo(next, followTarget(next.layout)) : { state: next, scrollTo: null };
    }
    case "scroll": {
      const echo = state.expected !== null && Math.abs(event.offset - state.expected) <= EPSILON;
      if (echo) return { state: { ...state, offset: event.offset, expected: null }, scrollTo: null };
      // A scroll that lands on the follow target is not the user leaving it. Scrolling back to
      // the bottom by hand follows again.
      const atTarget = state.following && Math.abs(event.offset - followTarget(state.layout)) <= EPSILON;
      const atBottom = event.offset >= maxOffset(state.layout) - BOTTOM_SLACK;
      return {
        state: { ...state, offset: event.offset, expected: null, following: atTarget || atBottom },
        scrollTo: null,
      };
    }
    case "prompt":
      return goTo({ ...state, following: true }, followTarget(state.layout));
    case "prepend": {
      const y = state.offset + event.addedHeight;
      return { state: { ...state, following: false, offset: y, expected: y }, scrollTo: y };
    }
  }
}
