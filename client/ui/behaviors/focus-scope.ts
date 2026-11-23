// Focus-within, as a pure tracker. A card is "focused" while any input inside it holds focus.
// Moving focus between two inputs fires blur then focus; the deferred leave keeps that from
// flickering to "outside" for one frame.

export type FocusTracker = {
  enter(id: string): void;
  leave(id: string): void;
  readonly inside: boolean;
};

const defaultDefer = (fn: () => void) => void setTimeout(fn, 0);

export function createFocusTracker(onChange: (inside: boolean) => void, defer: (fn: () => void) => void = defaultDefer): FocusTracker {
  const held = new Map<string, number>(); // source id -> generation of its latest enter
  let generation = 0;
  let inside = false;
  const emit = () => {
    const now = held.size > 0;
    if (now === inside) return;
    inside = now;
    onChange(now);
  };
  return {
    enter(id) {
      held.set(id, ++generation);
      emit();
    },
    leave(id) {
      const seen = held.get(id);
      if (seen === undefined) return;
      defer(() => {
        if (held.get(id) !== seen) return; // focus came back first
        held.delete(id);
        emit();
      });
    },
    get inside() {
      return inside;
    },
  };
}
