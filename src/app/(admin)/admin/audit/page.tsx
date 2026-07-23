import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAuditLog } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminActionType } from "@/lib/database.types";

const ACTION_LABEL: Record<AdminActionType, string> = {
  adjust_credit: "Adjusted credits",
  approve_request: "Approved request",
  deny_request: "Denied request",
  update_store_name: "Renamed store",
  delete_store: "Deleted store",
  grant_admin: "Granted admin",
  revoke_admin: "Revoked admin",
};

const ACTION_TEXT_COLOR: Record<AdminActionType, string> = {
  adjust_credit: "text-primary",
  approve_request: "text-up",
  deny_request: "text-muted",
  update_store_name: "text-ink",
  delete_store: "text-down",
  grant_admin: "text-up",
  revoke_admin: "text-down",
};

export default async function AdminAuditLogPage() {
  const supabase = createAdminClient();
  const entries = await listAuditLog(supabase);

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Audit log</h1>
      <p className="mt-1 text-sm text-body">Every platform-admin action, most recent first.</p>

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
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="py-3 pl-4">
                  <span
                    className={cn(
                      "inline-block rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium",
                      ACTION_TEXT_COLOR[entry.action]
                    )}
                  >
                    {ACTION_LABEL[entry.action]}
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
            ))}
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
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-hairline p-4">
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-block rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium",
                  ACTION_TEXT_COLOR[entry.action]
                )}
              >
                {ACTION_LABEL[entry.action]}
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
        ))}
        {entries.length === 0 && (
          <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
            No admin actions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
