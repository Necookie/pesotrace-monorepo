import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];
export type GroupPeriod = "daily" | "weekly" | "monthly";

/**
 * The only fields grouping actually reads. Kept structural so callers that
 * fetch a narrow column set (the reports page) can group without paying for
 * a full transactions row, while the ledger still passes complete rows
 * through and gets them back in `rows`.
 */
export type GroupableRow = Pick<Row, "occurred_at" | "amount" | "direction">;

export type TransactionGroup<T extends GroupableRow = Row> = {
  key: string;
  label: string;
  rows: T[];
  netTotal: number;
  sendTotal: number;
  receiveTotal: number;
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

export function groupTransactions<T extends GroupableRow>(
  rows: T[],
  period: GroupPeriod
): TransactionGroup<T>[] {
  const groups = new Map<string, TransactionGroup<T>>();

  for (const row of rows) {
    const { key, label } = groupKey(row.occurred_at, period);
    const existing = groups.get(key);
    const amount = Number(row.amount);
    const signedAmount = row.direction === "receive" ? amount : -amount;
    const send = row.direction === "send" ? amount : 0;
    const receive = row.direction === "receive" ? amount : 0;

    if (existing) {
      existing.rows.push(row);
      existing.netTotal += signedAmount;
      existing.sendTotal += send;
      existing.receiveTotal += receive;
    } else {
      groups.set(key, {
        key,
        label,
        rows: [row],
        netTotal: signedAmount,
        sendTotal: send,
        receiveTotal: receive,
      });
    }
  }

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}
