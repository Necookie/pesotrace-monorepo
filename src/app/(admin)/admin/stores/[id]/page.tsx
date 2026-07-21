import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreCreditDetail } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreditUsageChart } from "@/components/charts/credit-usage-chart";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";

const ENTRY_TYPE_LABEL: Record<string, string> = {
  grant: "Grant",
  consumption: "Consumption",
  adjustment: "Adjustment",
  refund: "Refund",
};

export default async function AdminStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const detail = await getStoreCreditDetail(supabase, id);

  if (!detail) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">{detail.storeName}</h1>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-hairline bg-canvas p-6">
        <div>
          <p className="text-sm text-muted">Credit balance</p>
          <p
            className={cn(
              "mt-1 font-mono text-3xl font-semibold",
              detail.balance <= 0 ? "text-down" : "text-ink"
            )}
          >
            {detail.balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <AdjustCreditsForm storeId={detail.storeId} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-ink">Usage trend</h2>
      <div className="mt-3">
        <CreditUsageChart data={detail.dailyUsage} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-ink">Ledger history</h2>
      <div className="mt-3 rounded-2xl border border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">Real cost</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.ledger.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-sm text-ink">
                  {ENTRY_TYPE_LABEL[entry.entryType] ?? entry.entryType}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    entry.creditDelta < 0 ? "text-down" : entry.creditDelta > 0 ? "text-up" : "text-muted"
                  )}
                >
                  {entry.creditDelta > 0 ? "+" : ""}
                  {entry.creditDelta.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-body">
                  {entry.costUsd > 0 ? formatExtractionCost(entry.costUsd) : "—"}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-body">{entry.note ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted">{entry.createdBy ?? "—"}</TableCell>
                <TableCell className="text-right text-sm text-muted">{formatDateTime(entry.createdAt)}</TableCell>
              </TableRow>
            ))}
            {detail.ledger.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted">
                  No credit activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
