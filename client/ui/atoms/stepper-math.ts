const round = (n: number) => Math.round(n * 1000) / 1000;

/** One step up or down, clamped to the range. Rounds away float drift (0.1 steps). */
export function stepValue(value: number, dir: 1 | -1, min: number, max: number, step: number): number {
  return Math.min(max, Math.max(min, round(value + dir * step)));
}

export const canStep = (value: number, dir: 1 | -1, min: number, max: number) =>
  dir === 1 ? value < max : value > min;
