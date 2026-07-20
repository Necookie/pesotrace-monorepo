import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { ClearHistoryCard } from "@/components/settings/clear-history-card";

export default async function DangerZonePage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  let transactionCount = 0;
  if (storeId) {
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId);
    transactionCount = count ?? 0;
  }

  return <ClearHistoryCard transactionCount={transactionCount} />;
}
