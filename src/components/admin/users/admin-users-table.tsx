"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  X,
  ExternalLink,
  Crown,
  Shield,
  UserCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HighlightedText } from "@/components/admin/highlighted-text";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { CopyBadge } from "@/components/admin/copy-badge";
import { formatDateTime, formatPeso, formatRelativeTime } from "@/lib/format";
import type { AdminUserRow } from "@/lib/queries/admin-types";

export function AdminUsersTable({
  users,
  query,
  selectedRole,
  selectedStoreId,
  stores,
}: {
  users: AdminUserRow[];
  query?: string;
  selectedRole?: string;
  selectedStoreId?: string;
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query ?? "");

  const activeSort = searchParams.get("sort") ?? "created";
  const activeDir = searchParams.get("dir") === "asc" ? "asc" : "desc";

  function updateQuery(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    router.push(`/admin/users?${params.toString()}`);
  }

  function handleSort(key: string) {
    if (activeSort === key) {
      updateQuery({ dir: activeDir === "asc" ? "desc" : "asc" });
    } else {
      updateQuery({ sort: key, dir: "desc" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search users or user IDs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateQuery({ q: e.target.value || null });
            }}
            className="pl-9 pr-9 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                updateQuery({ q: null });
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role pills */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-soft p-1">
            {[
              { id: "", label: "All roles" },
              { id: "owner", label: "Owners" },
              { id: "manager", label: "Managers" },
              { id: "staff", label: "Staff" },
            ].map((r) => {
              const active = (selectedRole ?? "") === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => updateQuery({ role: r.id || null })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-canvas text-ink shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Store selector */}
          <select
            value={selectedStoreId ?? ""}
            onChange={(e) => updateQuery({ storeId: e.target.value || null })}
            className="h-8 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All stores</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No users found"
          description={
            query || selectedRole || selectedStoreId
              ? "No users matched your current filters. Try changing your search query or role filter."
              : "No user accounts registered yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 pl-4 cursor-pointer hover:text-ink" onClick={() => handleSort("name")}>
                    User {activeSort === "name" ? (activeDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="py-3">Store</TableHead>
                  <TableHead className="py-3 cursor-pointer hover:text-ink" onClick={() => handleSort("role")}>
                    Role {activeSort === "role" ? (activeDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead
                    className="py-3 text-right cursor-pointer hover:text-ink"
                    onClick={() => handleSort("transactions")}
                  >
                    Transactions {activeSort === "transactions" ? (activeDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead
                    className="py-3 text-right cursor-pointer hover:text-ink"
                    onClick={() => handleSort("volume")}
                  >
                    Volume (PHP) {activeSort === "volume" ? (activeDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead className="py-3 text-right">Extractions</TableHead>
                  <TableHead
                    className="py-3 pr-4 text-right cursor-pointer hover:text-ink"
                    onClick={() => handleSort("activity")}
                  >
                    Last Active {activeSort === "activity" ? (activeDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.userId} className="hover:bg-surface-soft/60">
                    {/* User Name & Link to User Dashboard */}
                    <TableCell className="py-3 pl-4 font-medium">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/users/${u.userId}`}
                          className="text-ink hover:text-primary transition-colors inline-flex items-center gap-1.5 group font-semibold"
                        >
                          <HighlightedText text={u.fullName || "Unnamed User"} query={query ?? ""} />
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted" />
                        </Link>
                        <div className="mt-0.5 flex items-center gap-1">
                          <CopyBadge text={u.userId} label={u.userId.slice(0, 10) + "..."} />
                          {u.isPlatformAdmin && (
                            <span className="inline-flex items-center gap-0.5 rounded-pill bg-primary/15 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                              <ShieldCheck className="size-2.5" /> Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Store Name */}
                    <TableCell className="py-3 text-sm">
                      <Link
                        href={`/admin/stores/${u.storeId}`}
                        className="text-body hover:text-primary transition-colors"
                      >
                        <HighlightedText text={u.storeName} query={query ?? ""} />
                      </Link>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3">
                      {u.role === "owner" ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <Crown className="size-3" /> Owner
                        </span>
                      ) : u.role === "manager" ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                          <Shield className="size-3" /> Manager
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-surface-strong px-2 py-0.5 text-xs font-medium text-muted">
                          <UserCheck className="size-3" /> Staff
                        </span>
                      )}
                    </TableCell>

                    {/* Transactions Count */}
                    <TableCell className="py-3 text-right font-mono text-xs text-body">
                      {u.totalTransactionsCreated > 0 ? (
                        <span className="font-semibold text-ink">{u.totalTransactionsCreated.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </TableCell>

                    {/* Volume Processed */}
                    <TableCell className="py-3 text-right font-mono text-xs text-body">
                      {u.totalVolumeProcessed > 0 ? (
                        <span className="font-semibold text-ink">{formatPeso(u.totalVolumeProcessed)}</span>
                      ) : (
                        <span className="text-muted">₱0.00</span>
                      )}
                    </TableCell>

                    {/* Extractions Consumed */}
                    <TableCell className="py-3 text-right font-mono text-xs text-muted">
                      {u.extractionsConsumed > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-body">
                          <Zap className="size-3 text-primary" />
                          {u.extractionsConsumed} ({u.creditsConsumed} cr)
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Last Active */}
                    <TableCell className="py-3 pr-4 text-right text-xs text-muted">
                      {u.lastActiveAt ? (
                        <span title={formatDateTime(u.lastActiveAt)}>
                          {formatRelativeTime(u.lastActiveAt)}
                        </span>
                      ) : (
                        <span className="text-muted">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
