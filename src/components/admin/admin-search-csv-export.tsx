"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { escapeCsv } from "@/lib/csv";
import type { searchTransactionsAcrossStores } from "@/lib/queries/admin";

type SearchResultItem = Awaited<ReturnType<typeof searchTransactionsAcrossStores>>[number];

export function AdminSearchCsvExport({
  results,
  query,
}: {
  results: SearchResultItem[];
  query: string;
}) {
  const handleExport = () => {
    const headers = [
      "Store ID",
      "Store Name",
      "Transaction ID",
      "Occurred At",
      "Direction",
      "Category",
      "Amount",
      "Ref Number",
      "Counterparty Name",
      "Counterparty Number",
      "Status",
      "Fee Computed",
    ];

    const lines = results.map(({ transaction: t, storeId, storeName }) =>
      [
        storeId,
        storeName,
        t.id,
        t.occurred_at,
        t.direction,
        t.category,
        t.amount,
        t.ref_number,
        t.counterparty_name ?? "",
        t.counterparty_number ?? "",
        t.status,
        t.fee_computed,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = "\uFEFF" + [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pesotrace-admin-search-${query.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1.5 text-xs">
      <Download className="size-3.5" />
      Export CSV
    </Button>
  );
}
