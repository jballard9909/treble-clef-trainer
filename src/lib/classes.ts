import { supabase } from "@/integrations/supabase/client";
import {
  listMyCourses,
  listCourseStudents,
  ClassroomAuthError,
} from "./classroom";

export type ClassRow = {
  id: string;
  google_course_id: string;
  name: string;
  section: string | null;
  owner_user_id: string;
  last_synced_at: string | null;
};

export type ClassMemberRow = {
  id: string;
  class_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

export async function fetchMyClasses(userId: string): Promise<ClassRow[]> {
  // Classes the user owns or is a member of. Rely on RLS to filter, but also
  // need to surface "member-of" rows that the user doesn't own. RLS already
  // allows reading both, so a single select is enough.
  const { data, error } = await supabase
    .from("classes")
    .select("id,google_course_id,name,section,owner_user_id,last_synced_at")
    .order("name");
  if (error) throw error;
  // Filter to classes where the user is owner or a member (RLS already does this).
  return (data ?? []) as ClassRow[];
}

export async function fetchClassMembers(classId: string) {
  const { data, error } = await supabase
    .from("class_members")
    .select("id,class_id,user_id,role,joined_at")
    .eq("class_id", classId);
  if (error) throw error;
  return (data ?? []) as ClassMemberRow[];
}

export async function fetchClassLeaderboard(classId: string, gameId: string) {
  // Get members of the class, then their best scores.
  const { data: members, error: mErr } = await supabase
    .from("class_members")
    .select("user_id")
    .eq("class_id", classId);
  if (mErr) throw mErr;
  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("user_best_scores")
    .select("user_id,correct,total,accuracy,played_at,display_name,avatar_url")
    .eq("game_id", gameId)
    .in("user_id", userIds)
    .order("correct", { ascending: false })
    .order("accuracy", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type SyncResult = {
  ownedSynced: number;
  joined: number;
  studentsMatched: number;
};

/**
 * Pulls Google Classroom courses for the signed-in user.
 * - Courses where they teach become classes they own.
 * - Courses where they are a student: if the course is already in our DB
 *   (a teacher synced it), add the student as a member.
 * - For each owned class, match enrolled student emails to existing profiles
 *   and insert class_members for matches.
 */
export async function syncGoogleClassroom(userId: string): Promise<SyncResult> {
  const [teaching, learning] = await Promise.all([
    listMyCourses("teacher").catch((e) => {
      if (e instanceof ClassroomAuthError) throw e;
      return [];
    }),
    listMyCourses("student").catch((e) => {
      if (e instanceof ClassroomAuthError) throw e;
      return [];
    }),
  ]);

  let studentsMatched = 0;

  // Upsert owned classes
  if (teaching.length > 0) {
    const rows = teaching.map((c) => ({
      google_course_id: c.id,
      name: c.name,
      section: c.section ?? null,
      owner_user_id: userId,
      last_synced_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("classes")
      .upsert(rows, { onConflict: "google_course_id" });
    if (error) throw error;

    // Fetch the saved rows back to get their UUIDs
    const ids = teaching.map((c) => c.id);
    const { data: saved, error: selErr } = await supabase
      .from("classes")
      .select("id,google_course_id")
      .in("google_course_id", ids);
    if (selErr) throw selErr;
    const idMap = new Map((saved ?? []).map((r) => [r.google_course_id, r.id]));

    // Add owner as member (teacher role)
    const ownerMemberships = (saved ?? []).map((r) => ({
      class_id: r.id,
      user_id: userId,
      role: "teacher",
    }));
    if (ownerMemberships.length > 0) {
      await supabase
        .from("class_members")
        .upsert(ownerMemberships, { onConflict: "class_id,user_id" });
    }

    // For each course, fetch students and match by email
    for (const course of teaching) {
      const classUuid = idMap.get(course.id);
      if (!classUuid) continue;
      try {
        const students = await listCourseStudents(course.id);
        const emails = students
          .map((s) => s.profile.emailAddress?.toLowerCase())
          .filter((e): e is string => !!e);
        if (emails.length === 0) continue;
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,email")
          .in("email", emails);
        const memberships = (profiles ?? []).map((p) => ({
          class_id: classUuid,
          user_id: p.id,
          role: "student",
        }));
        if (memberships.length > 0) {
          await supabase
            .from("class_members")
            .upsert(memberships, { onConflict: "class_id,user_id" });
          studentsMatched += memberships.length;
        }
      } catch (e) {
        console.warn(`Failed to sync students for course ${course.id}`, e);
      }
    }
  }

  // For courses the user attends, join existing classes
  let joined = 0;
  if (learning.length > 0) {
    const ids = learning.map((c) => c.id);
    const { data: existing } = await supabase
      .from("classes")
      .select("id,google_course_id")
      .in("google_course_id", ids);
    const rows = (existing ?? []).map((c) => ({
      class_id: c.id,
      user_id: userId,
      role: "student",
    }));
    if (rows.length > 0) {
      const { error } = await supabase
        .from("class_members")
        .upsert(rows, { onConflict: "class_id,user_id" });
      if (!error) joined = rows.length;
    }
  }

  return {
    ownedSynced: teaching.length,
    joined,
    studentsMatched,
  };
}
