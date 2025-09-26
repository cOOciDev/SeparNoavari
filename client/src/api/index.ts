// API types + lightweight client (قابل‌تعویض با بک‌اند واقعی)

export type IdeaStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";

export interface Idea {
  id: string;
  title: string;
  track?: string;
  submittedAt: string; // ISO
  updatedAt?: string;  // ISO
  status: IdeaStatus;
  scoreAvg?: number | null;
}

export interface Judge {
  id: string;
  name: string;
  email?: string;
}

export interface Assignment {
  id: string;
  ideaId: string;
  judgeId: string;
  status: "ASSIGNED" | "DONE";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "judge" | "user";
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*                    Fetch helper (typed, JSON default)               */
/* ------------------------------------------------------------------ */

const CONTENT_TYPE_JSON = "application/json";

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", CONTENT_TYPE_JSON);
  }

  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    // Optional: try to read error payload
    let reason: string | undefined;
    try {
      const data = await res.clone().json();
      reason = (data && (data.message || data.error)) as string | undefined;
    } catch {
      // intentionally ignored
    }
    throw new Error(`${res.status} ${res.statusText}${reason ? ` - ${reason}` : ""}`);
  }

  // 204 No Content یا بدنه خالی
  const len = res.headers.get("content-length");
  if (res.status === 204 || len === "0") {
    return undefined as unknown as T;
  }

  // اگر سرور JSON برگرداند
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  // در غیر اینصورت متن ساده (در صورت نیاز می‌توان سفارشی کرد)
  return (await res.text()) as unknown as T;
}

/* ------------------------------------------------------------------ */
/*                                Ideas                                */
/* ------------------------------------------------------------------ */

export async function listIdeas(params?: Partial<{ q: string }>): Promise<Idea[]> {
  const q = params?.q ? `?q=${encodeURIComponent(params.q)}` : "";
  return api<Idea[]>(`/api/ideas${q}`);
}

export async function getIdea(id: string): Promise<Idea> {
  return api<Idea>(`/api/ideas/${id}`);
}

/* ------------------------------------------------------------------ */
/*                               Judges                                */
/* ------------------------------------------------------------------ */

export async function listJudges(): Promise<Judge[]> {
//   return api<Judge[]>(`/api/judges`); for srvr
const newp = [{
    id: "1",
    name: "Dr. Rasoul Karimi",
    role: "Chief Judge",
    affiliation: "Web & Game Studio",
    photo: "/images/committee/sara.jpg",
    shortBio:
      "Expert in disaster risk reduction and community resilience.",
    profileUrl: "#",
    tags: ["Risk", "Resilience"],
  },] 

  return newp;
}

export async function createJudge(payload: { name: string; email?: string }): Promise<Judge> {
  return api<Judge>(`/api/judges`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": CONTENT_TYPE_JSON },
  });
}

/* ------------------------------------------------------------------ */
/*                            Assignments                              */
/* ------------------------------------------------------------------ */

export async function listAssignments(): Promise<Assignment[]> {
  return api<Assignment[]>(`/api/assignments`);
}

export async function createAssignment(ideaId: string, judgeIds: string[]): Promise<void> {
  await api<void>(`/api/assignments`, {
    method: "POST",
    body: JSON.stringify({ ideaId, judgeIds }),
    headers: { "Content-Type": CONTENT_TYPE_JSON },
  });
}

/* ------------------------------------------------------------------ */
/*                                Users                                */
/* ------------------------------------------------------------------ */

export async function listUsers(): Promise<AdminUser[]> {
  return api<AdminUser[]>(`/api/users`);
}
// ... سایر import/export ها و type ها

export async function deleteIdea(id: string): Promise<void> {
  await api<void>(`/api/ideas/${id}`, { method: "DELETE" });
}

