// Thin wrapper around Google Classroom REST API. Uses the user's
// provider_token (OAuth access token) captured at Google sign-in.
import { readGoogleToken } from "./google-token";

const BASE = "https://classroom.googleapis.com/v1";

export class ClassroomAuthError extends Error {
  constructor(message = "Google Classroom access not granted. Sign in with Google again to allow access.") {
    super(message);
    this.name = "ClassroomAuthError";
  }
}

async function gfetch<T>(path: string): Promise<T> {
  const t = readGoogleToken();
  if (!t) throw new ClassroomAuthError();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${t.token}` },
  });
  if (res.status === 401 || res.status === 403) {
    throw new ClassroomAuthError(
      res.status === 403
        ? "Google Classroom returned 403. Your account may not have access to Classroom (Workspace for Education required), or you didn't grant the needed scopes."
        : "Google session expired. Sign in with Google again.",
    );
  }
  if (!res.ok) throw new Error(`Classroom API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export type GoogleCourse = {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
};

export type GoogleStudent = {
  userId: string;
  profile: {
    id: string;
    name?: { fullName?: string };
    emailAddress?: string;
    photoUrl?: string;
  };
};

export async function listMyCourses(role: "teacher" | "student"): Promise<GoogleCourse[]> {
  const param = role === "teacher" ? "teacherId=me" : "studentId=me";
  let pageToken: string | undefined;
  const out: GoogleCourse[] = [];
  do {
    const qs = new URLSearchParams({ pageSize: "100", courseStates: "ACTIVE" });
    if (pageToken) qs.set("pageToken", pageToken);
    const res = await gfetch<{ courses?: GoogleCourse[]; nextPageToken?: string }>(
      `/courses?${param}&${qs.toString()}`,
    );
    out.push(...(res.courses ?? []));
    pageToken = res.nextPageToken;
  } while (pageToken);
  return out;
}

export async function listCourseStudents(courseId: string): Promise<GoogleStudent[]> {
  let pageToken: string | undefined;
  const out: GoogleStudent[] = [];
  do {
    const qs = new URLSearchParams({ pageSize: "100" });
    if (pageToken) qs.set("pageToken", pageToken);
    const res = await gfetch<{ students?: GoogleStudent[]; nextPageToken?: string }>(
      `/courses/${courseId}/students?${qs.toString()}`,
    );
    out.push(...(res.students ?? []));
    pageToken = res.nextPageToken;
  } while (pageToken);
  return out;
}
