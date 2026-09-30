/**
 * Numbers small enough to be list markers, month counts or weekday-like
 * references are not checked; every larger figure must come from the
 * computed facts.
 */
const IGNORED_MAX = 12;

const GROUPED = /^-?\d{1,3}(?:[ .]\d{3})+(?:,\d+)?$/;

export function extractNumbers(text: string): number[] {
  const numbers: number[] = [];
  // 1.234,56 and 1 234,56 (Romanian) alongside plain 1234.56
  for (const match of text.matchAll(/-?\d{1,3}(?:[ .]\d{3})+(?:,\d+)?|-?\d+(?:[.,]\d+)?/g)) {
    const raw = match[0];
    const normalized = GROUPED.test(raw)
      ? raw.replace(/[ .]/g, "").replace(",", ".")
      : raw.replace(/ /g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isFinite(value)) numbers.push(Math.abs(value));
  }
  return numbers;
}

function isAllowed(value: number, allowed: Set<number>): boolean {
  if (allowed.has(value)) return true;
  // Tight on purpose: the facts already contain every rounded variant, so a
  // figure that misses by more than a rounding step was not computed.
  const tolerance = Math.max(0.51, value * 0.001);
  for (const candidate of allowed) {
    if (Math.abs(candidate - value) <= tolerance) return true;
  }
  return false;
}

/** Figures present in the answer that cannot be traced back to the facts. */
export function findUngroundedNumbers(text: string, allowed: Set<number>): number[] {
  const currentYear = new Date().getFullYear();
  const ungrounded = new Set<number>();
  for (const value of extractNumbers(text)) {
    if (value <= IGNORED_MAX) continue;
    if (value === currentYear || value === currentYear + 1) continue;
    if (!isAllowed(value, allowed)) ungrounded.add(value);
  }
  return [...ungrounded];
}
