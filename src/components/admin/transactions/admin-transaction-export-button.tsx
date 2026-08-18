"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAdminTransactionsCsv } from "@/lib/admin-transaction-export";
import type { AdminTransactionRow } from "@/lib/queries/admin-types";

export function AdminTransactionExportButton({
  transactions,
  filenamePrefix = "admin-transactions",
}: {
  transactions: AdminTransactionRow[];
  filenamePrefix?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={transactions.length === 0}
      onClick={() => downloadAdminTransactionsCsv(transactions, filenamePrefix)}
      className="h-8 gap-1.5 text-xs text-body hover:text-ink"
    >
      <Download className="size-3.5" />
      Export page CSV ({transactions.length})
    </Button>
  );
}
