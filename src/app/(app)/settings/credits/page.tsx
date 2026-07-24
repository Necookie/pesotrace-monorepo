import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { RequestTrialCreditsCard } from "@/components/settings/request-trial-credits";

export default async function CreditsPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();

  let balance = 0;
  let hasPendingRequest = false;

  if (storeId) {
    const [{ data: credits }, { data: pending }] = await Promise.all([
      supabase.from("store_credits").select("balance").eq("store_id", storeId).maybeSingle(),
      supabase
        .from("credit_requests")
        .select("id")
        .eq("store_id", storeId)
        .eq("status", "pending")
        .maybeSingle(),
    ]);
    balance = credits?.balance ?? 0;
    hasPendingRequest = Boolean(pending);
  }

  return <RequestTrialCreditsCard balance={balance} hasPendingRequest={hasPendingRequest} />;
}
