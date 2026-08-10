import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformSettings } from "@/lib/queries/admin";
import { formatDateTime } from "@/lib/format";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

export default async function PlatformSettingsPage() {
  const supabase = createAdminClient();
  const settings = await getPlatformSettings(supabase);

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Platform settings</h1>
      <p className="mt-1 text-sm text-body">
        Operational settings that used to require a code change and a deploy to adjust.
      </p>

      <div className="mt-6">
        <PlatformSettingsForm
          initialThreshold={settings.lowBalanceThreshold}
          initialDefaultGrant={settings.defaultGrantAmount}
        />
        {settings.updatedBy && (
          <p className="mt-2 text-xs text-muted">
            Last changed {formatDateTime(settings.updatedAt)} by {settings.updatedBy}
          </p>
        )}
      </div>
    </div>
  );
}
