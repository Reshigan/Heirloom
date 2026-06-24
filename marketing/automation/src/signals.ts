// System signals for the monthly content planner.
//
// Reads the worker's GET /api/admin/social/signals — aggregate counts only, no
// PII — guarded by the long-lived SOCIAL_UPLOAD_TOKEN so the unattended monthly
// cron can read it without an expiring admin session. Returns null when
// unconfigured or on any error: the planner then runs signal-blind rather than
// failing, so a missing token never breaks generation.

export interface Signals {
  users: number;
  familyMembers: number;
  memories: number;
  letters: number;
  voiceRecordings: number;
  asOf: string;
}

export async function fetchSignals(): Promise<Signals | null> {
  const base = process.env.HEIRLOOM_API_URL;
  const token = process.env.SOCIAL_UPLOAD_TOKEN;
  if (!base || !token) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/admin/social/signals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Signals;
  } catch {
    return null;
  }
}

// Turn raw counts into a qualitative steer for the generator. NEVER cite the
// numbers in copy — brand voice forbids "join N families" social-proof — so the
// hint only nudges the *angle* toward whatever families actually do here. The
// month's plan therefore shifts with the system: a voice-heavy month leans into
// the spoken word, an empty month leans into the very first step.
export function signalHint(s: Signals | null): string | undefined {
  if (!s) return undefined;
  if (s.users === 0) {
    return "The product is brand new — almost no families have started yet. Lean into the very first step: opening the thread, asking one question today. Do NOT reference a community, crowd, or 'other families' — there isn't one yet.";
  }
  const acts: [string, number, string][] = [
    ["voice", s.voiceRecordings, "Families here lean toward recording voices — favor the spoken word: hearing a voice again, a recording that outlasts the person, the exact way someone said something."],
    ["letters", s.letters, "Families here lean toward written letters — favor time-lockable notes meant to be opened later, a letter held until a date that matters."],
    ["memories", s.memories, "Families here lean toward written remembrances — favor short captured stories and specific moments written down."],
  ];
  acts.sort((a, b) => b[1] - a[1]);
  const [, top, hint] = acts[0];
  if (top === 0) {
    return "Families have signed up but few have written anything yet — favor the gentle nudge to capture the first thing today, the smallest possible start.";
  }
  return hint;
}
