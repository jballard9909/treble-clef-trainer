// Diatonic step from E4 = 0. Only natural notes are shown on the staff.
// Range: A3 (step -5) to C6 (step 12).
export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type NoteName = (typeof NOTE_NAMES)[number];

// Map diatonic step -> natural note letter.
// Step 0 = E4. Letters cycle C,D,E,F,G,A,B.
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_INDEX_AT_STEP_0 = 2; // E

export function letterForStep(step: number): NoteName {
  const idx = ((LETTER_INDEX_AT_STEP_0 + step) % 7 + 7) % 7;
  return LETTERS[idx] as NoteName;
}

export const STAFF_RANGE = { min: -5, max: 12 };

export function randomStep(prev?: number): number {
  const range = STAFF_RANGE.max - STAFF_RANGE.min + 1;
  for (let i = 0; i < 8; i++) {
    const s = STAFF_RANGE.min + Math.floor(Math.random() * range);
    if (s !== prev) return s;
  }
  return STAFF_RANGE.min + Math.floor(Math.random() * range);
}
