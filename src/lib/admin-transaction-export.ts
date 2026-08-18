import { formatDateTime } from "@/lib/format";
import type { AdminTransactionRow } from "@/lib/queries/admin-types";

export function generateAdminTransactionsCsv(transactions: AdminTransactionRow[]): string {
  const headers = [
    "Transaction ID",
    "Store Name",
    "Store ID",
    "Reference Number",
    "Occurred At",
    "Direction",
    "Category",
    "Amount (PHP)",
    "Fee Computed (PHP)",
    "Status",
    "Source Type",
    "Counterparty Name",
    "Counterparty Number",
    "Logged By",
    "Notes",
    "Confidence",
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.storeName,
    t.storeId,
    t.refNumber,
    formatDateTime(t.occurredAt),
    t.direction.toUpperCase(),
    t.category,
    t.amount.toFixed(2),
    t.feeComputed.toFixed(2),
    t.status,
    t.sourceType,
    t.counterpartyName ?? "",
    t.counterpartyNumber ?? "",
    t.creatorName ?? t.createdBy ?? "",
    t.notes ?? "",
    t.confidence !== null ? `${Math.round(t.confidence * 100)}%` : "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadAdminTransactionsCsv(
  transactions: AdminTransactionRow[],
  filenamePrefix = "admin-transactions"
) {
  const csv = generateAdminTransactionsCsv(transactions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
