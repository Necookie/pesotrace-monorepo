import type { AdminActionType } from "@/lib/database.types";

export type AdminActionCategory = "credits" | "security" | "store" | "config";

export interface FormattedAdminAction {
  label: string;
  category: AdminActionCategory;
  colorClass: string;
  badgeClass: string;
}

export const ADMIN_ACTION_CONFIG: Record<AdminActionType, FormattedAdminAction> = {
  adjust_credit: {
    label: "Adjusted credits",
    category: "credits",
    colorClass: "text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  bulk_grant_credits: {
    label: "Bulk-granted credits",
    category: "credits",
    colorClass: "text-primary",
    badgeClass: "bg-primary/15 text-primary border-primary/25",
  },
  approve_request: {
    label: "Approved trial request",
    category: "credits",
    colorClass: "text-emerald-600",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  deny_request: {
    label: "Denied trial request",
    category: "credits",
    colorClass: "text-muted",
    badgeClass: "bg-surface-strong text-muted border-hairline",
  },
  update_store_name: {
    label: "Renamed store",
    category: "store",
    colorClass: "text-ink",
    badgeClass: "bg-surface-strong text-ink border-hairline",
  },
  delete_store: {
    label: "Deleted store",
    category: "store",
    colorClass: "text-rose-600",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  suspend_store: {
    label: "Suspended store",
    category: "store",
    colorClass: "text-rose-600",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  unsuspend_store: {
    label: "Unsuspended store",
    category: "store",
    colorClass: "text-emerald-600",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  grant_admin: {
    label: "Granted admin role",
    category: "security",
    colorClass: "text-indigo-600",
    badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  revoke_admin: {
    label: "Revoked admin role",
    category: "security",
    colorClass: "text-rose-600",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  update_fee_tiers: {
    label: "Updated fee setup",
    category: "config",
    colorClass: "text-ink",
    badgeClass: "bg-surface-strong text-ink border-hairline",
  },
  update_admin_notes: {
    label: "Updated admin notes",
    category: "store",
    colorClass: "text-body",
    badgeClass: "bg-surface-strong text-body border-hairline",
  },
  update_platform_settings: {
    label: "Updated platform settings",
    category: "config",
    colorClass: "text-ink",
    badgeClass: "bg-surface-strong text-ink border-hairline",
  },
};

export function formatAdminAction(action: AdminActionType): FormattedAdminAction {
  return ADMIN_ACTION_CONFIG[action] ?? {
    label: action.replace(/_/g, " "),
    category: "config",
    colorClass: "text-ink",
    badgeClass: "bg-surface-strong text-ink border-hairline",
  };
}
