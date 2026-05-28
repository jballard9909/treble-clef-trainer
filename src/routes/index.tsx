import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Staff } from "@/components/Staff";
import { NOTE_NAMES, letterForStep, randomStep, type NoteName } from "@/lib/notes";
import { useAuth } from "@/lib/auth-context";
import {
  fetchPersonalBest,
  saveScore,
  TREBLE_CLEF_GAME_ID,
  type ScoreRow,
} from "@/lib/scores";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Treble Clef Trainer — Clef" },
      {
        name: "description",
        content:
          "Sixty seconds, twelve notes. Practice reading treble clef notes and beat your high score.",
      },
    ],
  }),
  component: Home,
});

const GAME_SECONDS = 60;
const LOCAL_HIGH_KEY = "treble-clef-high-score-v1";

function readLocalHigh(): ScoreRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_HIGH_KEY);
    return raw ? (JSON.parse(raw) as ScoreRow) : null;
  } catch {
    return null;
  }
}

function isBetter(candidate: { correct: number; accuracy: number }, prev: ScoreRow | null) {
  if (!prev) return true;
  if (candidate.correct !== prev.correct) return candidate.correct > prev.correct;
  return candidate.accuracy > prev.accuracy;
}

function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [step, setStep] = useState<number>(() => randomStep());
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [wrong, setWrong] = useState(false);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Personal best: from DB when signed in, localStorage otherwise.
  const highQuery = useQuery({
    queryKey: ["personal-best", TREBLE_CLEF_GAME_ID, user?.id ?? "local"],
    queryFn: async () =>
      user ? await fetchPersonalBest(user.id, TREBLE_CLEF_GAME_ID) : readLocalHigh(),
  });
  const highScore = highQuery.data ?? null;

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

  const finishGame = useCallback(async () => {
    setPhase("done");
    const accuracy = total === 0 ? 0 : correct / total;
    const candidate = { correct, total, accuracy, played_at: new Date().toISOString() };

    // Persist round
    if (user && total > 0) {
      try {
        await saveScore(user.id, TREBLE_CLEF_GAME_ID, correct, total);
      } catch (e) {
        console.error("Failed to save score", e);
      }
    }

    // Determine new high before refreshing
    const beatsPrev = isBetter(candidate, highScore) && total > 0;
    setIsNewHigh(beatsPrev);

    if (user) {
      queryClient.invalidateQueries({ queryKey: ["personal-best"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    } else if (beatsPrev) {
      localStorage.setItem(LOCAL_HIGH_KEY, JSON.stringify(candidate));
      queryClient.setQueryData(
        ["personal-best", TREBLE_CLEF_GAME_ID, "local"],
        candidate,
      );
    }
  }, [correct, total, user, highScore, queryClient]);

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
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Treble Clef Trainer
          </h1>
          <p className="mt-2 text-muted-foreground">
            Name the note. Sixty seconds. Beat your high score.
          </p>
          {!user && (
            <p className="mt-3 text-sm">
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              <span className="text-muted-foreground">
                to save scores and join the leaderboard.
              </span>
            </p>
          )}
        </header>

        <section className="rounded-2xl border bg-card/70 backdrop-blur p-6 sm:p-8 shadow-2xl shadow-black/30">
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
              All-time best: {highScore.correct}/{highScore.total} ({Math.round(highScore.accuracy * 100)}%)
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
  highScore: ScoreRow | null;
  isNewHigh: boolean;
  onClose: () => void;
}) {
  // After save+invalidation the high score query will reflect the new value; show whichever is higher to avoid a flash of stale data.
  const displayedHigh = isNewHigh
    ? { correct, total, accuracy: total === 0 ? 0 : correct / total }
    : highScore;

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

        {displayedHigh && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-2xl font-semibold tabular-nums">
              {displayedHigh.correct}
              <span className="text-muted-foreground">/{displayedHigh.total}</span>
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
