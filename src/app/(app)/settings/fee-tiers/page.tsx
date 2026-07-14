import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { FeeTierTable } from "@/components/settings/fee-tier-table";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";

export default async function FeeTiersPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  let config = DEFAULT_FEE_TIER_CONFIG;
  if (storeId) {
    const { data } = await supabase
      .from("stores")
      .select("fee_tier_config")
      .eq("id", storeId)
      .single();
    if (data?.fee_tier_config) config = data.fee_tier_config;
  }

  return <FeeTierTable initial={config} />;
}
