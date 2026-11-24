// Pure placement for a popover. No React.

/** A button's place in the window. */
export type Anchor = { x: number; y: number; w: number; h: number };

/** Where a panel of `width` x `height` goes: under the anchor, right edges level, kept in the window, flipped above when short of room. */
export function place(at: Anchor, panel: { width: number; height: number }, win: { width: number; height: number }, margin = 8, gap = 4) {
  const left = Math.max(margin, Math.min(at.x + at.w - panel.width, win.width - panel.width - margin));
  const below = at.y + at.h + gap;
  const top = below + panel.height > win.height - margin ? Math.max(margin, at.y - panel.height - gap) : below;
  return { left, top };
}

