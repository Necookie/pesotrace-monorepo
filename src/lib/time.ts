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

/**
 * The Monday (Manila calendar) that starts the week an instant falls in, as
 * a YYYY-MM-DD key. Built from the already-Manila-resolved day key and then
 * walked backward as pure calendar math (like previousDayKey) — never
 * re-interpreted as an instant, so it can't drift across a host timezone.
 */
export function storeWeekKey(iso: string | Date): string {
  const [y, m, d] = storeDayKey(iso).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  date.setUTCDate(diff);
  return date.toISOString().slice(0, 10);
}

/** The Manila calendar month (YYYY-MM) an instant falls in. */
export function storeMonthKey(iso: string | Date): string {
  return storeDayKey(iso).slice(0, 7);
}

/** The Monday-key one week before a given week-start key, via pure calendar math. */
export function previousWeekKey(weekKey: string): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().slice(0, 10);
}

/** The last `count` Manila week-start keys ending with the current week, oldest first. */
export function recentWeekKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  let key = storeWeekKey(now);
  for (let i = 0; i < count; i++) {
    keys.push(key);
    key = previousWeekKey(key);
  }
  return keys.reverse();
}

/** The YYYY-MM key one calendar month before a given month key. */
export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
}

/** The last `count` Manila month keys ending with the current month, oldest first. */
export function recentMonthKeys(count: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  let key = storeMonthKey(now);
  for (let i = 0; i < count; i++) {
    keys.push(key);
    key = previousMonthKey(key);
  }
  return keys.reverse();
}

/** Formats a week-start key as e.g. "Jul 21 – Jul 27". */
export function formatWeekKeyShort(weekKey: string): string {
  const [y, m, d] = weekKey.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const fmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Formats a YYYY-MM month key as e.g. "Jul 2026". */
export function formatMonthKeyShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "short", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}
