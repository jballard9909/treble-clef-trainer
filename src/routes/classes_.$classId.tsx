import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchClassLeaderboard, fetchClassMembers } from "@/lib/classes";
import { TREBLE_CLEF_GAME_ID } from "@/lib/scores";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/classes_/$classId")({
  head: () => ({
    meta: [
      { title: "Class — Clef" },
      { name: "description", content: "Class leaderboard for the treble clef game." },
    ],
  }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const { classId } = Route.useParams();
  const { user } = useAuth();

  const { data: cls } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id,name,section,owner_user_id")
        .eq("id", classId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["class-members", classId],
    queryFn: () => fetchClassMembers(classId),
  });

  const { data: leaderboard, isLoading: lbLoading } = useQuery({
    queryKey: ["class-leaderboard", classId, TREBLE_CLEF_GAME_ID],
    queryFn: () => fetchClassLeaderboard(classId, TREBLE_CLEF_GAME_ID),
  });

  if (!cls) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Class not found or you don't have access.</p>
        <Link to="/classes" className="underline text-primary mt-4 inline-block">Back to classes</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/classes" className="text-sm text-muted-foreground hover:text-foreground">← All classes</Link>
      <header className="mt-3 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">{cls.name}</h1>
          {cls.section && <p className="text-muted-foreground">{cls.section}</p>}
        </div>
        <div className="text-sm text-muted-foreground">
          {members?.length ?? 0} member{(members?.length ?? 0) === 1 ? "" : "s"}
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Treble Clef leaderboard</h2>
        {lbLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !leaderboard || leaderboard.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            No scores in this class yet. Be the first to play!
          </div>
        ) : (
          <ol className="rounded-2xl border bg-card divide-y overflow-hidden">
            {leaderboard.map((r, i) => {
              const isMe = r.user_id === user?.id;
              return (
                <li
                  key={r.user_id}
                  className={`flex items-center gap-4 px-4 py-3 ${isMe ? "bg-primary/10" : ""}`}
                >
                  <div className="w-6 text-right font-mono text-muted-foreground">{i + 1}</div>
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center text-xs font-semibold">
                      {r.display_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 truncate">
                    <div className="font-medium truncate">
                      {r.display_name ?? "Anonymous"} {isMe && <span className="text-xs text-primary">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((Number(r.accuracy) || 0) * 100)}% accuracy
                    </div>
                  </div>
                  <div className="font-display text-xl font-semibold tabular-nums">
                    {r.correct}<span className="text-muted-foreground text-sm">/{r.total}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
