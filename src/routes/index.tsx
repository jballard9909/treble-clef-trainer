import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Staff } from "@/components/Staff";
import { NOTE_NAMES, letterForStep, randomStep, type NoteName } from "@/lib/notes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Treble Clef Trainer — Music Theory Practice" },
      {
        name: "description",
        content:
          "A 60-second treble clef note identification game. Practice reading notes from two ledger lines below to two above the staff.",
      },
      { property: "og:title", content: "Treble Clef Trainer" },
      { property: "og:description", content: "60-second music theory note practice." },
    ],
  }),
  component: Home,
});

const GAME_SECONDS = 60;
const HIGH_SCORE_KEY = "treble-clef-high-score-v1";

type HighScore = { correct: number; total: number; accuracy: number };

function readHighScore(): HighScore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    return raw ? (JSON.parse(raw) as HighScore) : null;
  } catch {
    return null;
  }
}

function Home() {
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [step, setStep] = useState<number>(() => randomStep());
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [wrong, setWrong] = useState(false);
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHighScore(readHighScore());
  }, []);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  const correctAnswer: NoteName = useMemo(() => letterForStep(step), [step]);

  const startGame = () => {
    setCorrect(0);
    setTotal(0);
    setTimeLeft(GAME_SECONDS);
    setWrong(false);
    setIsNewHigh(false);
    setStep(randomStep());
    setPhase("playing");
  };

  const finishGame = useCallback(() => {
    setPhase("done");
    const accuracy = total === 0 ? 0 : correct / total;
    const prev = readHighScore();
    const isHigher =
      !prev ||
      accuracy > prev.accuracy ||
      (accuracy === prev.accuracy && correct > prev.correct);
    if (isHigher && total > 0) {
      const next = { correct, total, accuracy };
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(next));
      setHighScore(next);
      setIsNewHigh(true);
    } else {
      setHighScore(prev);
      setIsNewHigh(false);
    }
  }, [correct, total]);

  const handleAnswer = (note: NoteName) => {
    if (phase !== "playing") return;
    if (note === correctAnswer) {
      setCorrect((c) => c + 1);
      setTotal((t) => t + 1);
      setWrong(false);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      setStep((prev) => randomStep(prev));
    } else {
      setTotal((t) => t + 1);
      setWrong(true);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(false), 1200);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Treble Clef Trainer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Name the note. Sixty seconds. Beat your high score.
          </p>
        </header>

        <section className="rounded-2xl border bg-card/70 backdrop-blur p-6 sm:p-8 shadow-2xl shadow-black/30">
          {/* HUD */}
          <div className="flex items-center justify-between text-sm font-medium mb-6">
            <div className="rounded-full bg-secondary px-3 py-1.5 tabular-nums">
              Score <span className="text-primary">{correct}</span>
              <span className="text-muted-foreground"> / {total}</span>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 tabular-nums ${
                phase === "playing" && timeLeft <= 10
                  ? "bg-destructive/20 text-destructive"
                  : "bg-secondary"
              }`}
            >
              {phase === "playing" ? `${timeLeft}s` : `${GAME_SECONDS}s`}
            </div>
          </div>

          {/* Staff area */}
          <div className="relative rounded-xl bg-background/50 border py-6 min-h-[260px] flex items-center">
            <Staff step={step} />
            {wrong && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xl sm:text-2xl font-semibold text-destructive bg-background/80 px-4 py-2 rounded-lg shadow-lg">
                  Wrong answer. Try again!
                </p>
              </div>
            )}
          </div>

          {/* Answer buttons */}
          <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 gap-2">
            {NOTE_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => handleAnswer(n)}
                disabled={phase !== "playing"}
                className="h-12 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {n}
              </button>
            ))}
          </div>

          {/* Start / restart */}
          {phase !== "playing" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
              >
                {phase === "idle" ? "Start 60-second round" : "Play again"}
              </button>
            </div>
          )}

          {highScore && phase === "idle" && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              All-time best: {highScore.correct}/{highScore.total}
            </p>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Notes range from two ledger lines below to two above the staff.
        </p>
      </div>

      {phase === "done" && (
        <ResultModal
          correct={correct}
          total={total}
          highScore={highScore}
          isNewHigh={isNewHigh}
          onClose={startGame}
        />
      )}
    </main>
  );
}

function ResultModal({
  correct,
  total,
  highScore,
  isNewHigh,
  onClose,
}: {
  correct: number;
  total: number;
  highScore: HighScore | null;
  isNewHigh: boolean;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Time's up
        </p>
        {isNewHigh && (
          <p className="mt-3 text-lg font-bold text-success animate-pulse">
            ★ New high score! ★
          </p>
        )}
        <p className="mt-4 text-5xl font-bold tabular-nums">
          {correct}
          <span className="text-muted-foreground">/{total}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Your score</p>

        {highScore && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-2xl font-semibold tabular-nums">
              {highScore.correct}
              <span className="text-muted-foreground">/{highScore.total}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">All-time high score</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-8 w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
