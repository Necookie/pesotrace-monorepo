import { ShieldCheck, KeyRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format";
import { AdminsPanel } from "@/components/admin/admins-panel";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";

export default async function PlatformAdminsPage() {
  const supabase = createAdminClient();
  const { data: admins } = await supabase
    .from("platform_admins")
    .select("user_id, added_by, note, created_at")
    .order("created_at", { ascending: true });

  const bootstrapIds = (process.env.PLATFORM_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Platform admins</h1>
      <p className="mt-1 text-sm text-body">Who can access this admin dashboard.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <AdminKpiTile
          label="DB-managed admins"
          value={String(admins?.length ?? 0)}
          icon={ShieldCheck}
          accent="primary"
        />
        <AdminKpiTile
          label="Env bootstrap admins"
          value={String(bootstrapIds.length)}
          icon={KeyRound}
          accent="muted"
        />
      </div>

      {bootstrapIds.length > 0 && (
        <div className="mt-6 rounded-2xl border border-hairline bg-surface-soft p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Env bootstrap admins</h2>
          <p className="mt-1 text-xs text-muted">
            Set via <span className="font-mono">PLATFORM_ADMIN_USER_IDS</span> — a permanent break-glass list, not
            editable here. Change it in your deployment&apos;s environment variables.
          </p>
          <div className="mt-3 space-y-1.5">
            {bootstrapIds.map((id) => (
              <p key={id} className="font-mono text-sm text-body">
                {id}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <AdminsPanel
          admins={(admins ?? []).map((a) => ({
            userId: a.user_id,
            addedBy: a.added_by,
            note: a.note,
            createdAt: formatDateTime(a.created_at),
          }))}
        />
      </div>
    </div>
  );
}
