import { supabase } from "@/integrations/supabase/client";

export const TREBLE_CLEF_GAME_ID = "treble_clef";

export type ScoreRow = {
  correct: number;
  total: number;
  accuracy: number;
  played_at: string;
};

export type LeaderboardRow = ScoreRow & {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function saveScore(
  userId: string,
  gameId: string,
  correct: number,
  total: number,
) {
  const { error } = await supabase
    .from("game_scores")
    .insert({ user_id: userId, game_id: gameId, correct, total });
  if (error) throw error;
}

export async function fetchPersonalBest(
  userId: string,
  gameId: string,
): Promise<ScoreRow | null> {
  const { data, error } = await supabase
    .from("game_scores")
    .select("correct,total,accuracy,played_at")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .order("correct", { ascending: false })
    .order("accuracy", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ScoreRow | null;
}

export async function fetchLeaderboard(
  gameId: string,
  limit = 25,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("user_best_scores")
    .select("user_id,correct,total,accuracy,played_at,display_name,avatar_url")
    .eq("game_id", gameId)
    .order("correct", { ascending: false })
    .order("accuracy", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}
