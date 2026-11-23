// Pure rules for Glide: when does a card slide, and from where.

const EPSILON = 0.5;

/**
 * Translate to start from so a card that moved from `prevY` to `nextY` appears to slide.
 * `inFlight` is the offset it is still showing from an unfinished slide, so a second move
 * continues from where the card is, not where it was laid out.
 */
export function glideOffset(prevY: number | undefined, nextY: number, enabled: boolean, inFlight = 0): number | null {
  if (!enabled || prevY === undefined) return null;
  if (Math.abs(prevY - nextY) <= EPSILON) return null;
  return prevY - nextY + inFlight;
}

/** A card grows in only if it joined after the board loaded, and motion is allowed. */
export const shouldEnter = (presentAtLoad: boolean, reducedMotion: boolean) => !presentAtLoad && !reducedMotion;

/**
 * Top of each card in a column, from the heights measured so far. Position comes from order and
 * height, not from layout events, because a card that only moved fires none on the web.
 * A card after one with an unknown height has no known position yet.
 */
export function layoutPositions(heights: (number | undefined)[], gap: number): (number | undefined)[] {
  let y: number | undefined = 0;
  return heights.map((h) => {
    const top = y;
    y = y === undefined || h === undefined ? undefined : y + h + gap;
    return top;
  });
}
