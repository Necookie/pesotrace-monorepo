import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";

export default async function NotificationsSettingsPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  let prefs = { extractionFailed: true, lowBalance: true };
  if (storeId) {
    const { data } = await supabase.from("stores").select("notification_prefs").eq("id", storeId).single();
    if (data?.notification_prefs) prefs = data.notification_prefs;
  }

  return <NotificationPrefsForm initial={prefs} />;
}
