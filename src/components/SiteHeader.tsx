import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    null;
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/70 border-b">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-semibold tracking-tight">
          Clef<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
            activeProps={{ className: "px-3 py-1.5 rounded-md bg-secondary" }}
            activeOptions={{ exact: true }}
          >
            Play
          </Link>
          <Link
            to="/leaderboard"
            className="px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
            activeProps={{ className: "px-3 py-1.5 rounded-md bg-secondary" }}
          >
            Leaderboard
          </Link>
          {loading ? (
            <div className="w-20 h-8" />
          ) : user ? (
            <div className="flex items-center gap-2 ml-2">
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="w-7 h-7 rounded-full border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                  {name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:brightness-110 transition"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
