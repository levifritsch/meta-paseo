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
