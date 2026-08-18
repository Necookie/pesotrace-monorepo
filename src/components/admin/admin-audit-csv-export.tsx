"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { formatAdminAction } from "@/lib/admin-audit-format";
import type { AdminAuditLogEntry } from "@/lib/queries/admin";

export function AdminAuditCsvExport({ entries }: { entries: AdminAuditLogEntry[] }) {
  function handleExport() {
    const headers = ["Action", "Category", "Store Name", "Store ID", "Detail", "Actor User ID", "Created At"];
    const rows = entries.map((e) => {
      const formatted = formatAdminAction(e.action);
      return [
        formatted.label,
        formatted.category,
        e.storeName ?? "",
        e.storeId ?? "",
        e.targetSummary ?? "",
        e.actorUserId ?? "",
        formatDateTime(e.createdAt),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleExport}
      disabled={entries.length === 0}
      className="flex items-center gap-1.5"
    >
      <Download className="size-3.5" />
      <span>Export CSV</span>
    </Button>
  );
}
