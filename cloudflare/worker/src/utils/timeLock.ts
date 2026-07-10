/**
 * When does an `unlock_date` actually mature?
 *
 * A sealed note that opens EARLY is a broken promise; one that opens a few
 * hours late is merely imprecise. Everything here is biased toward late.
 *
 * `new Date('2041-06-01')` is UTC midnight, so a bare date compared straight
 * against `now` releases the note on 31 May in Hawaii. Two boundaries close
 * that gap:
 *
 *   1. The browser sends an instant. It knows the author's zone, so it posts
 *      their local midnight as a full ISO timestamp (see the frontend's
 *      `localDateToInstant`). That is the precise answer, and we honour it.
 *   2. A bare `YYYY-MM-DD` still arrives from older rows and any non-browser
 *      client. We have no zone for those, so we mature them at 12:00 UTC —
 *      the moment that calendar date has begun in UTC-12, the last zone on
 *      Earth to reach it. Never early, anywhere.
 */

/** The instant an `unlock_date` matures. Bare dates mature at 12:00 UTC. */
export function unlockInstant(unlockDate: string): Date {
  const bare = /^\d{4}-\d{2}-\d{2}$/.test(unlockDate.trim());
  return new Date(bare ? `${unlockDate.trim()}T12:00:00Z` : unlockDate);
}

/** Has this `unlock_date` matured as of `now`? Unparseable dates never mature. */
export function unlockMatured(unlockDate: string, now: Date): boolean {
  const at = unlockInstant(unlockDate);
  return !Number.isNaN(at.getTime()) && at <= now;
}

/**
 * Has `birthDate` reached `ageYears` as of `now`, everywhere on Earth?
 *
 * A birthday is a bare date with the same problem: nobody's eighteenth birthday
 * begins at UTC midnight. We hold the count back 12 hours so the year only
 * turns once the birthday has begun in UTC-12 — never early, at worst a day late.
 */
export function ageMatured(birthDate: string, ageYears: number, now: Date): boolean {
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return false;

  const asOf = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  let age = asOf.getUTCFullYear() - born.getUTCFullYear();
  const months = asOf.getUTCMonth() - born.getUTCMonth();
  if (months < 0 || (months === 0 && asOf.getUTCDate() < born.getUTCDate())) age--;
  return age >= ageYears;
}
