import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function escapeCsv(value: string | number | null): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function transactionsToCsv(rows: Row[]): string {
  const header = [
    "Date",
    "Direction",
    "Amount",
    "Fee",
    "Reference No.",
    "Counterparty Name",
    "Counterparty Number",
    "Status",
  ];

  const lines = rows.map((r) =>
    [
      r.occurred_at,
      r.direction,
      r.amount,
      r.fee_computed,
      r.ref_number,
      r.counterparty_name,
      r.counterparty_number,
      r.status,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [header.join(","), ...lines].join("\n");
}
