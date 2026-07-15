export function formatPeso(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Sub-cent USD costs need more precision than Intl.NumberFormat's currency mode allows. */
export function formatExtractionCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(5)}`;
  return `$${usd.toFixed(4)}`;
}

/** Compact axis-tick form: ₱1.2K / ₱3.4M instead of the full ₱1,234.00. */
export function formatPesoCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `₱${(amount / 1_000).toFixed(1)}K`;
  return `₱${amount.toFixed(0)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
