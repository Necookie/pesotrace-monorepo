/**
 * Day-boundary helpers pinned to the store's local timezone.
 *
 * Every store is in the Philippines (UTC+8, no DST), so "today" must be the
 * Manila calendar day — not the UTC day the rest of the dashboard's charts
 * bucket by. Getting this wrong makes "today's income" read the previous
 * day's total every morning until 8am, which is exactly when an owner is
 * reconciling the drawer.
 *
 * If a store is ever onboarded outside PH, this constant becomes a per-store
 * `stores.timezone` column and these helpers take it as an argument.
 */
export const STORE_TIME_ZONE = "Asia/Manila";

/** The Manila calendar day (YYYY-MM-DD) an instant falls on. */
export function storeDayKey(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  // en-CA formats as YYYY-MM-DD, which sorts lexicographically as it does
  // chronologically — handy for keying and ordering.
  return new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIME_ZONE }).format(date);
}

/** Today's Manila calendar day (YYYY-MM-DD). */
export function storeToday(now: Date = new Date()): string {
  return storeDayKey(now);
}

/** Yesterday relative to a Manila day key, without any timezone round-trip. */
export function previousDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  // Construct in UTC and step back a day purely on the calendar, so this is
  // unaffected by the runtime's own timezone.
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** The last `count` Manila day keys ending today, oldest first. */
export function recentDayKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  let key = storeToday(now);
  for (let i = 0; i < count; i++) {
    keys.push(key);
    key = previousDayKey(key);
  }
  return keys.reverse();
}

/**
 * Formats a YYYY-MM-DD day key as e.g. "Jul 27" without re-parsing it as an
 * instant — `new Date("2026-07-27")` is UTC midnight, which would render as
 * the day before in a negative-offset display locale. Building from parts
 * sidesteps that entirely.
 */
export function formatDayKeyShort(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    new Date(y, m - 1, d)
  );
}
