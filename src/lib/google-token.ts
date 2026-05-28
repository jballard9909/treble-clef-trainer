// Google provider token storage. Supabase returns provider_token only on the
// initial sign-in event; we stash it in localStorage so subsequent page loads
// can still call the Classroom API on behalf of the user.
import { supabase } from "@/integrations/supabase/client";

const KEY = "google-provider-token-v1";

export type StoredGoogleToken = {
  token: string;
  // Best-effort epoch seconds when it expires.
  expiresAt: number;
};

export function readGoogleToken(): StoredGoogleToken | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGoogleToken;
    if (!parsed.token) return null;
    if (parsed.expiresAt && parsed.expiresAt * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeGoogleToken(t: StoredGoogleToken | null) {
  if (typeof window === "undefined") return;
  if (!t) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(t));
}

/**
 * Listens for Supabase auth events and stashes the Google provider_token.
 * Call once at app boot.
 */
export function bindGoogleTokenCapture() {
  return supabase.auth.onAuthStateChange((_event, session) => {
    const token = session?.provider_token;
    if (token) {
      const expiresIn = (session as { provider_token_expires_in?: number } | null)
        ?.provider_token_expires_in;
      writeGoogleToken({
        token,
        expiresAt: Math.floor(Date.now() / 1000) + (expiresIn ?? 3500),
      });
    }
    if (_event === "SIGNED_OUT") writeGoogleToken(null);
  });
}

export const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "openid",
  "email",
  "profile",
].join(" ");
