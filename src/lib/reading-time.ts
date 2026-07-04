const WORDS_PER_MINUTE = 200;

/**
 * Estimate reading time in whole minutes (minimum 1) from raw text.
 */
export function readingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
