"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadAdminUsersCsv } from "@/lib/admin-user-export";
import type { AdminUserRow } from "@/lib/queries/admin-types";

export function AdminUserExportButton({
  users,
  filenamePrefix = "admin-users",
}: {
  users: AdminUserRow[];
  filenamePrefix?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={users.length === 0}
      onClick={() => downloadAdminUsersCsv(users, filenamePrefix)}
      className="h-8 gap-1.5 text-xs text-body hover:text-ink"
    >
      <Download className="size-3.5" />
      Export Users CSV ({users.length})
    </Button>
  );
}
