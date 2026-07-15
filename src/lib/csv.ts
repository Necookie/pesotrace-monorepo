import type { Database } from "@/lib/database.types";
import { last4Ref } from "@/lib/schemas/transaction";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function escapeCsv(value: string | number | null): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

/**
 * Column layout matches the store's own paper daily-summary sheet exactly
 * (Date | Time | Reference/CP# | Cash In | Cash Out | Load | Amount |
 * Service Fee | Last 4-digit Reference#), so this export can be printed or
 * cross-checked directly against their existing process.
 */
export function transactionsToCsv(rows: Row[]): string {
  const header = [
    "Date",
    "Time",
    "Reference / CP #",
    "Cash In",
    "Cash Out",
    "Load",
    "Amount",
    "Service Fee",
    "Last 4-Digit Reference #",
  ];

  const lines = rows.map((r) => {
    const referenceOrCp = r.counterparty_number || r.ref_number;
    const cashIn = r.category === "cash_in" ? r.amount : "";
    const cashOut = r.category === "cash_out" ? r.amount : "";
    const load = r.category === "load" ? r.amount : "";

    return [
      r.occurred_at.slice(0, 10),
      formatTime(r.occurred_at),
      referenceOrCp,
      cashIn,
      cashOut,
      load,
      r.amount,
      r.fee_computed,
      last4Ref(r.ref_number),
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [header.join(","), ...lines].join("\n");
}
