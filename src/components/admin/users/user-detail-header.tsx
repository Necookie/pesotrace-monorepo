import Link from "next/link";
import {
  ChevronLeft,
  Crown,
  Shield,
  UserCheck,
  ShieldCheck,
  Store as StoreIcon,
  Calendar,
} from "lucide-react";
import { CopyBadge } from "@/components/admin/copy-badge";
import { formatDateTime } from "@/lib/format";
import type { AdminUserDetailData } from "@/lib/queries/admin-types";

export function UserDetailHeader({ user }: { user: AdminUserDetailData["user"] }) {
  return (
    <div className="space-y-3">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink transition-colors"
      >
        <ChevronLeft className="size-3.5" />
        Back to Users Directory
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-hairline bg-canvas p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-ink">
              {user.fullName || "Unnamed User"}
            </h1>

            {/* Role Badge */}
            {user.role === "owner" ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Crown className="size-3" /> Store Owner
              </span>
            ) : user.role === "manager" ? (
              <span className="inline-flex items-center gap-1 rounded-pill bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                <Shield className="size-3" /> Store Manager
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-pill bg-surface-strong px-2.5 py-0.5 text-xs font-semibold text-muted">
                <UserCheck className="size-3" /> Staff
              </span>
            )}

            {/* Admin Badge */}
            {user.isPlatformAdmin && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <ShieldCheck className="size-3" /> Platform Operator
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <span className="text-body font-medium">User ID:</span>
              <CopyBadge text={user.id} />
            </div>

            <Link
              href={`/admin/stores/${user.storeId}`}
              className="flex items-center gap-1.5 text-body hover:text-primary transition-colors font-medium"
            >
              <StoreIcon className="size-3.5 text-primary" />
              <span>Store: {user.storeName}</span>
            </Link>

            <div className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              <span>Joined {formatDateTime(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
