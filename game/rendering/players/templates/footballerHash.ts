// Tiny shared string hash used by both footballerVariantsV1.ts and
// footballerVariantsV2.ts to deterministically derive a look from a
// player's `label` — kept as one small util so v1/v2 don't each carry their
// own copy of the same few lines.
// djb2-ish — small, dependency-free, stable across platforms (unlike relying
// on iteration order or Math.random).
export function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash);
}
