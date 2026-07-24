import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";
import { UploadFlow } from "./upload-flow";

export default async function UploadPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();

  let feeTierConfig = DEFAULT_FEE_TIER_CONFIG;
  if (storeId) {
    const { data } = await supabase
      .from("stores")
      .select("fee_tier_config")
      .eq("id", storeId)
      .single();
    if (data?.fee_tier_config) feeTierConfig = data.fee_tier_config;
  }

  return <UploadFlow feeTierConfig={feeTierConfig} />;
}
