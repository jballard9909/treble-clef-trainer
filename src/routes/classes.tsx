import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyClasses, syncGoogleClassroom } from "@/lib/classes";
import { ClassroomAuthError } from "@/lib/classroom";
import { readGoogleToken, CLASSROOM_SCOPES } from "@/lib/google-token";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/classes")({
  head: () => ({
    meta: [
      { title: "Classes — Clef" },
      { name: "description", content: "Sync your Google Classroom courses and compare scores with classmates." },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ["classes", user?.id],
    queryFn: () => fetchMyClasses(user!.id),
    enabled: !!user,
  });

  const sync = useMutation({
    mutationFn: () => syncGoogleClassroom(user!.id),
    onSuccess: (r) => {
      setStatusMsg(
        `Synced ${r.ownedSynced} class${r.ownedSynced === 1 ? "" : "es"} you teach, joined ${r.joined}, matched ${r.studentsMatched} student${r.studentsMatched === 1 ? "" : "s"}.`,
      );
      refetch();
    },
    onError: (e: unknown) => {
      setStatusMsg(e instanceof Error ? e.message : "Sync failed");
    },
  });

  const reconnectGoogle = async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
      extraParams: {
        scope: CLASSROOM_SCOPES,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
      },
    });
  };

  if (loading) return null;
  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-display font-semibold">Sign in to see your classes</h1>
        <p className="mt-2 text-muted-foreground">Use Google to sync your Google Classroom courses.</p>
        <Link to="/login" className="inline-block mt-6 h-11 px-5 rounded-lg bg-primary text-primary-foreground font-semibold leading-[44px]">
          Sign in
        </Link>
      </main>
    );
  }

  const hasGoogleToken = !!readGoogleToken();
  const isAuthErr = sync.error instanceof ClassroomAuthError;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight">Classes</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Sync your Google Classroom courses to compare scores with classmates.
          </p>
        </div>
        <div className="flex gap-2">
          {!hasGoogleToken && (
            <button
              onClick={reconnectGoogle}
              className="h-10 px-4 rounded-lg bg-secondary text-secondary-foreground font-medium hover:brightness-110"
            >
              Connect Google
            </button>
          )}
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {sync.isPending ? "Syncing…" : "Sync from Google Classroom"}
          </button>
        </div>
      </header>

      {statusMsg && (
        <div className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm">
          {statusMsg}
          {isAuthErr && (
            <button onClick={reconnectGoogle} className="ml-3 underline text-primary">
              Reconnect Google
            </button>
          )}
        </div>
      )}

      <section className="mt-8">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !classes || classes.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              No classes yet. Click <span className="font-semibold text-foreground">Sync from Google Classroom</span> to pull your courses.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Google Classroom requires a Google Workspace for Education account.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {classes.map((c) => (
              <li key={c.id}>
                <Link
                  to="/classes/$classId"
                  params={{ classId: c.id }}
                  className="block rounded-xl border bg-card p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      {c.section && (
                        <div className="text-sm text-muted-foreground">{c.section}</div>
                      )}
                    </div>
                    {c.owner_user_id === user.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                        Teacher
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
