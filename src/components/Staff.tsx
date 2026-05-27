/**
 * Renders a treble clef staff with a single whole note at a given diatonic position.
 * `step` is the number of diatonic steps from the bottom line (E4 = 0).
 * Range used by the game: -5 (A3, two ledger lines below) to 12 (C6, two ledger lines above).
 */
type Props = { step: number };

const LINE_GAP = 12; // px between adjacent staff lines (so half-step = LINE_GAP/2 per diatonic step)
const STAFF_TOP = 80; // y-position of the top staff line (F5)
const STAFF_LEFT = 40;
const STAFF_WIDTH = 320;

// Bottom line E4 has step=0, top line F5 has step=8. y decreases as step increases.
function yForStep(step: number) {
  const bottomLineY = STAFF_TOP + 4 * LINE_GAP; // E4
  return bottomLineY - (step * LINE_GAP) / 2;
}

export function Staff({ step }: Props) {
  const noteY = yForStep(step);
  const noteX = STAFF_LEFT + STAFF_WIDTH / 2 + 20;

  // Ledger lines: every line position (even step) outside the 0..8 staff range.
  const ledgerSteps: number[] = [];
  if (step <= -2) {
    for (let s = -2; s >= step - (step % 2 === 0 ? 0 : 1); s -= 2) ledgerSteps.push(s);
  }
  if (step >= 10) {
    for (let s = 10; s <= step + (step % 2 === 0 ? 0 : 1); s += 2) ledgerSteps.push(s);
  }

  return (
    <svg
      viewBox={`0 0 ${STAFF_LEFT * 2 + STAFF_WIDTH} 240`}
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Treble clef staff with a whole note"
    >
      {/* Staff lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1={STAFF_LEFT}
          x2={STAFF_LEFT + STAFF_WIDTH}
          y1={STAFF_TOP + i * LINE_GAP}
          y2={STAFF_TOP + i * LINE_GAP}
          stroke="var(--color-staff)"
          strokeWidth={1.5}
        />
      ))}

      {/* Treble clef glyph */}
      <text
        x={STAFF_LEFT + 8}
        y={STAFF_TOP + 4 * LINE_GAP + 14}
        fontSize={84}
        fill="var(--color-staff)"
        style={{ fontFamily: "serif" }}
      >
        𝄞
      </text>

      {/* Ledger lines for the note */}
      {ledgerSteps.map((s) => (
        <line
          key={s}
          x1={noteX - 16}
          x2={noteX + 16}
          y1={yForStep(s)}
          y2={yForStep(s)}
          stroke="var(--color-staff)"
          strokeWidth={1.5}
        />
      ))}

      {/* Whole note */}
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={9}
        ry={6.5}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.5}
        transform={`rotate(-20 ${noteX} ${noteY})`}
      />
    </svg>
  );
}
