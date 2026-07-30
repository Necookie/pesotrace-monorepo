import type { Database } from "@/lib/database.types";
import { last4Ref } from "@/lib/schemas/transaction";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function escapeCsv(value: string | number | null): string {
  let str = String(value ?? "");
  // Neutralize formula injection: a leading =, +, -, or @ makes Excel/Sheets
  // evaluate the cell as a formula when opened. Source data here can come
  // from OCR of a user-supplied screenshot, so it isn't trustworthy input.
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // occurred_at is a Manila wall-clock time stored under a UTC label — pin the
  // zone to UTC so the exported time is the receipt's time, not one shifted by
  // whatever timezone the export server happens to run in.
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
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

  // Prepend the UTF-8 BOM (\uFEFF) so Excel and Google Sheets auto-detect the
  // encoding and render Philippine names / special characters correctly without
  // requiring the import wizard. The BOM is invisible in every modern editor
  // and has no effect on programmatic consumers that read UTF-8 by default.
  return "\uFEFF" + [header.join(","), ...lines].join("\n");
}
