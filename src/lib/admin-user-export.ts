import { formatDateTime } from "@/lib/format";
import type { AdminUserRow } from "@/lib/queries/admin-types";

export function generateAdminUsersCsv(users: AdminUserRow[]): string {
  const headers = [
    "User ID",
    "Full Name",
    "Role",
    "Store Name",
    "Store ID",
    "Is Platform Admin",
    "Transactions Created",
    "Volume Processed (PHP)",
    "Fees Generated (PHP)",
    "Extractions Consumed",
    "Credits Consumed",
    "Joined Date",
    "Last Active",
  ];

  const rows = users.map((u) => [
    u.userId,
    u.fullName ?? "",
    u.role,
    u.storeName,
    u.storeId,
    u.isPlatformAdmin ? "Yes" : "No",
    String(u.totalTransactionsCreated),
    u.totalVolumeProcessed.toFixed(2),
    u.totalFeesGenerated.toFixed(2),
    String(u.extractionsConsumed),
    String(u.creditsConsumed),
    formatDateTime(u.createdAt),
    u.lastActiveAt ? formatDateTime(u.lastActiveAt) : "Never",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function downloadAdminUsersCsv(users: AdminUserRow[], filenamePrefix = "admin-users") {
  const csv = generateAdminUsersCsv(users);
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
