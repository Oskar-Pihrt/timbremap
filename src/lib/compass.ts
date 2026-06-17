/**
 * Compass coordinate conventions:
 *   x: Technical (-1)  ..  Atmospheric (+1)
 *   y: Bass      (-1)  ..  Treble      (+1)
 * Both axes are floats clamped to [-1, 1].
 */

export const AXES = {
  xNegative: "Technical",
  xPositive: "Atmospheric",
  yNegative: "Bass",
  yPositive: "Treble",
} as const;

export function clamp(n: number, min = -1, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Convert a compass coordinate (-1..1, -1..1) to a CSS position (%) inside the
 * square. Origin (0,0) maps to the center. y is inverted because screen-y
 * grows downward while Treble is at the top.
 */
export function toPercent(x: number, y: number): { left: string; top: string } {
  return {
    left: `${((clamp(x) + 1) / 2) * 100}%`,
    top: `${((1 - clamp(y)) / 2) * 100}%`,
  };
}

/** Inverse of toPercent: a click at fractional (fx, fy) in [0,1] → coordinate. */
export function fromFraction(fx: number, fy: number): { x: number; y: number } {
  return {
    x: clamp(fx * 2 - 1),
    y: clamp(1 - fy * 2),
  };
}

function intensity(v: number): string {
  const a = Math.abs(v);
  if (a < 0.12) return "neutral";
  if (a < 0.4) return "slightly";
  if (a < 0.72) return "fairly";
  return "very";
}

/**
 * Describe an average placement in words — used for SEO/accessibility text in
 * the server-rendered HTML (e.g. "slightly bassy and fairly atmospheric").
 */
export function describePlacement(x: number | null, y: number | null): string {
  if (x === null || y === null) return "No community placement yet.";

  const yWord = (() => {
    const word = y >= 0 ? "trebly" : "bassy";
    const grade = intensity(y);
    return grade === "neutral" ? "balanced treble/bass" : `${grade} ${word}`;
  })();

  const xWord = (() => {
    const word = x >= 0 ? "atmospheric" : "technical";
    const grade = intensity(x);
    return grade === "neutral" ? "balanced technical/atmospheric" : `${grade} ${word}`;
  })();

  return `${capitalize(yWord)} and ${xWord}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
