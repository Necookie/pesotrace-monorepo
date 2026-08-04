import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { getStoreOwnerEmail } from "@/lib/email/recipients";
import { getPlatformSettings } from "@/lib/queries/admin";
import { captureException } from "@/lib/monitoring-server";
import { LowBalanceOwnerEmail } from "@/components/email/templates/low-balance-owner";
import { LowBalanceDigestEmail } from "@/components/email/templates/low-balance-digest";

const RENOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type LowBalanceSweepResult = {
  checked: number;
  notified: number;
};

export async function runLowBalanceSweep(): Promise<LowBalanceSweepResult> {
  const supabase = createAdminClient();

  // Configurable from /admin/settings instead of a hardcoded constant — see
  // getPlatformSettings for the fallback if the settings row is ever missing.
  const { lowBalanceThreshold } = await getPlatformSettings(supabase);

  const { data: lowStores, error } = await supabase
    .from("store_credits")
    .select("store_id, balance, low_balance_notified_at")
    .lte("balance", lowBalanceThreshold);

  if (error) {
    await captureException(error, "server", { context: "runLowBalanceSweep" });
    return { checked: 0, notified: 0 };
  }

  const now = Date.now();
  const dueForNotification = (lowStores ?? []).filter((row) => {
    if (!row.low_balance_notified_at) return true;
    return now - new Date(row.low_balance_notified_at).getTime() > RENOTIFY_COOLDOWN_MS;
  });

  const digestEntries: { name: string; balance: number }[] = [];

  for (const row of dueForNotification) {
    try {
      const [{ data: store }, ownerEmail] = await Promise.all([
        supabase.from("stores").select("name, notification_prefs").eq("id", row.store_id).maybeSingle(),
        getStoreOwnerEmail(supabase, row.store_id),
      ]);
      const storeName = store?.name ?? "Unnamed store";
      // The operator digest always includes every low-balance store
      // regardless of that store's own notification prefs — those prefs
      // only control the owner-facing email below.
      digestEntries.push({ name: storeName, balance: row.balance });

      if (ownerEmail && (!store?.notification_prefs || store.notification_prefs.lowBalance)) {
        await sendEmail({
          to: ownerEmail,
          subject: row.balance <= 0 ? `${storeName} is out of AI credits` : `${storeName} is running low on credits`,
          react: <LowBalanceOwnerEmail storeName={storeName} balance={row.balance} appUrl={APP_URL} />,
        });
      }

      await supabase
        .from("store_credits")
        .update({ low_balance_notified_at: new Date().toISOString() })
        .eq("store_id", row.store_id);
    } catch (e) {
      await captureException(e, "server", { context: "runLowBalanceSweep", storeId: row.store_id });
    }
  }

  const operatorEmail = process.env.OPERATOR_ALERT_EMAIL;
  if (operatorEmail && digestEntries.length > 0) {
    try {
      await sendEmail({
        to: operatorEmail,
        subject: `${digestEntries.length} store${digestEntries.length === 1 ? "" : "s"} running low on credits`,
        react: <LowBalanceDigestEmail stores={digestEntries} adminUrl={`${APP_URL}/admin`} />,
      });
    } catch (e) {
      await captureException(e, "server", { context: "runLowBalanceSweep:digest" });
    }
  }

  return { checked: lowStores?.length ?? 0, notified: digestEntries.length };
}
