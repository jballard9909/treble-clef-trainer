import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard, TREBLE_CLEF_GAME_ID } from "@/lib/scores";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Clef" },
      { name: "description", content: "Top treble clef trainer scores across all players." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", TREBLE_CLEF_GAME_ID],
    queryFn: () => fetchLeaderboard(TREBLE_CLEF_GAME_ID),
  });

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Treble Clef Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Each player's personal best — ranked by correct answers, then accuracy.
          </p>
        </header>

        <div className="rounded-2xl border bg-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : !data || data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No scores yet. Be the first!
            </div>
          ) : (
            <ol className="divide-y">
              {data.map((row, i) => {
                const isMe = user?.id === row.user_id;
                const pct = Math.round(row.accuracy * 100);
                return (
                  <li
                    key={row.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-primary/5" : ""}`}
                  >
                    <div className="w-7 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                      {i + 1}
                    </div>
                    {row.avatar_url ? (
                      <img
                        src={row.avatar_url}
                        alt=""
                        className="w-9 h-9 rounded-full border"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-secondary grid place-items-center text-sm font-semibold">
                        {(row.display_name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {row.display_name ?? "Anonymous"}
                        {isMe && <span className="ml-2 text-xs text-primary">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pct}% accuracy
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="font-semibold">
                        {row.correct}
                        <span className="text-muted-foreground">/{row.total}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </main>
  );
}
