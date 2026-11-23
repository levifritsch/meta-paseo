/** Up to this many lines show whole. */
export const CODE_FULL_LINES = 10;
/** A longer one folds to this many. */
export const CODE_FOLDED_LINES = 5;

export type FoldedCode = { shown: string; hiddenLines: number; foldable: boolean };

/** Lines are counted as written, not as wrapped. Pass `expanded` once the user taps Show more. */
export function foldCode(text: string, expanded = false): FoldedCode {
  const lines = text.split("\n");
  if (lines.length <= CODE_FULL_LINES || expanded) return { shown: text, hiddenLines: 0, foldable: lines.length > CODE_FULL_LINES };
  return { shown: lines.slice(0, CODE_FOLDED_LINES).join("\n"), hiddenLines: lines.length - CODE_FOLDED_LINES, foldable: true };
}
