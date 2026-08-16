import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { computeStoreHealth } from "@/lib/admin-health";
import type { AdminStoreRow } from "@/lib/queries/admin";

export function generateStoresCsv(stores: AdminStoreRow[]): string {
  const headers = [
    "Store Name",
    "Store ID",
    "Health Status",
    "Account Status",
    "Credit Balance",
    "Requests Today",
    "Extractions (30d)",
    "Real Cost USD (30d)",
    "Last Activity",
  ];

  const rows = stores.map((s) => {
    const health = computeStoreHealth(s);
    return [
      s.storeName,
      s.storeId,
      health.label,
      s.suspended ? "Suspended" : s.balance <= 0 ? "Out of credits" : "Active",
      String(s.balance),
      String(s.requestsToday),
      String(s.extractionsThisMonth),
      formatExtractionCost(s.costUsdThisMonth),
      s.lastActivityAt ? formatDateTime(s.lastActivityAt) : "Never",
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadStoresCsv(stores: AdminStoreRow[], filenamePrefix = "stores") {
  const csv = generateStoresCsv(stores);
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
