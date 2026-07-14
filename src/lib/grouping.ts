import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];
export type GroupPeriod = "daily" | "weekly" | "monthly";

export type TransactionGroup = {
  key: string;
  label: string;
  rows: Row[];
  netTotal: number;
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function groupKey(iso: string, period: GroupPeriod): { key: string; label: string } {
  const d = new Date(iso);
  if (period === "daily") {
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    };
  }
  if (period === "weekly") {
    const start = startOfWeek(d);
    const key = start.toISOString().slice(0, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return {
      key,
      label: `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`,
    };
  }
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { key, label: d.toLocaleDateString("en-PH", { month: "long", year: "numeric" }) };
}

export function groupTransactions(rows: Row[], period: GroupPeriod): TransactionGroup[] {
  const groups = new Map<string, TransactionGroup>();

  for (const row of rows) {
    const { key, label } = groupKey(row.occurred_at, period);
    const existing = groups.get(key);
    const signedAmount = row.direction === "receive" ? Number(row.amount) : -Number(row.amount);

    if (existing) {
      existing.rows.push(row);
      existing.netTotal += signedAmount;
    } else {
      groups.set(key, { key, label, rows: [row], netTotal: signedAmount });
    }
  }

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}
