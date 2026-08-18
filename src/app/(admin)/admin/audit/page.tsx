import Link from "next/link";
import { ScrollText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAuditLog } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { AdminAuditCsvExport } from "@/components/admin/admin-audit-csv-export";
import { formatAdminAction } from "@/lib/admin-audit-format";
import type { AdminActionType } from "@/lib/database.types";

export default async function AdminAuditLogPage() {
  const supabase = createAdminClient();
  const entries = await listAuditLog(supabase);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-ink">Audit log</h1>
          <p className="mt-1 text-sm text-body">Every platform-admin action, most recent first.</p>
        </div>
        <AdminAuditCsvExport entries={entries} />
      </div>

      <div className="mt-6 max-w-xs">
        <AdminKpiTile label="Logged actions" value={String(entries.length)} icon={ScrollText} accent="primary" />
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-hairline md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 pl-4">Action</TableHead>
              <TableHead className="py-3">Store</TableHead>
              <TableHead className="py-3">Detail</TableHead>
              <TableHead className="py-3">Actor</TableHead>
              <TableHead className="py-3 pr-4 text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const formatted = formatAdminAction(entry.action);
              return (
                <TableRow key={entry.id}>
                  <TableCell className="py-3 pl-4">
                    <span
                      className={cn(
                        "inline-block rounded-pill border px-2.5 py-0.5 text-xs font-medium",
                        formatted.badgeClass
                      )}
                    >
                      {formatted.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-body">
                    {entry.storeId ? (
                      <Link href={`/admin/stores/${entry.storeId}`} className="text-ink hover:text-primary">
                        {entry.storeName}
                      </Link>
                    ) : (
                      (entry.storeName ?? "—")
                    )}
                  </TableCell>
                  <TableCell className="max-w-sm truncate text-sm text-body">{entry.targetSummary ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted">{entry.actorUserId}</TableCell>
                  <TableCell className="py-3 pr-4 text-right text-sm text-muted">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted">
                  No admin actions logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="mt-6 flex flex-col gap-3 md:hidden">
        {entries.map((entry) => {
          const formatted = formatAdminAction(entry.action);
          return (
            <div key={entry.id} className="rounded-2xl border border-hairline p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "inline-block rounded-pill border px-2.5 py-0.5 text-xs font-medium",
                    formatted.badgeClass
                  )}
                >
                  {formatted.label}
                </span>
                <span className="shrink-0 text-xs text-muted">{formatDateTime(entry.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">
                {entry.storeId ? (
                  <Link href={`/admin/stores/${entry.storeId}`} className="hover:text-primary">
                    {entry.storeName}
                  </Link>
                ) : (
                  (entry.storeName ?? "—")
                )}
              </p>
              {entry.targetSummary && <p className="mt-1 text-sm text-body">{entry.targetSummary}</p>}
              <p className="mt-2 text-xs text-muted">{entry.actorUserId}</p>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
            No admin actions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
