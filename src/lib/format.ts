// Intl formatter construction is measurably expensive on each call in hot
// paths like the ledger page (100+ rows rendered). All formatters are
// constructed once at module load and reused for the process lifetime.
const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export function formatPeso(amount: number): string {
  return pesoFormatter.format(amount);
}

// Transaction timestamps (occurred_at) hold the receipt's Manila wall-clock
// time stored under a UTC label — 7:00 PM is "...T19:00:00Z". Formatting must
// therefore pin the zone to UTC to render those exact digits back (7:00 PM);
// leaving it unset renders in the server's own timezone, which on a Manila
// machine shifts every time +8h (7:00 PM shows as 3:00 AM). Pinning makes the
// output identical on any host.
const DISPLAY_TIME_ZONE = "UTC";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: DISPLAY_TIME_ZONE,
});

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateTimeFormatter.format(d);
}

/**
 * Static approximate USD->PHP rate for displaying Gemini's real per-call
 * cost in the store's own currency — not live-fetched, update if it drifts
 * far from the market rate.
 */
const USD_TO_PHP_RATE = 58;

/** Sub-centavo costs need more precision than Intl.NumberFormat's currency mode allows. */
export function formatExtractionCost(usd: number): string {
  const php = usd * USD_TO_PHP_RATE;
  if (php === 0) return "₱0.00";
  if (php < 0.01) return `₱${php.toFixed(5)}`;
  return `₱${php.toFixed(4)}`;
}

/** Compact axis-tick form: ₱1.2K / ₱3.4M instead of the full ₱1,234.00. */
export function formatPesoCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`;
  return `₱${amount.toFixed(0)}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateFormatter.format(d);
}
