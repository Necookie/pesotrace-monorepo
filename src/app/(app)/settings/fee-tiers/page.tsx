import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { FeeTierTable } from "@/components/settings/fee-tier-table";
import { FeeFormulaEditor } from "@/components/settings/fee-formula-editor";
import { FeeCalculatorSimulator } from "@/components/settings/fee-calculator-simulator";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";

export default async function FeeTiersPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();

  let config = DEFAULT_FEE_TIER_CONFIG;
  let formula: string | null = null;
  if (storeId) {
    const { data } = await supabase
      .from("stores")
      .select("fee_tier_config, fee_formula")
      .eq("id", storeId)
      .single();
    if (data?.fee_tier_config) config = data.fee_tier_config;
    formula = data?.fee_formula ?? null;
  }

  return (
    <div className="space-y-6">
      {formula && (
        <p className="rounded-2xl bg-surface-soft px-4 py-3 text-xs text-body">
          A custom fee formula is active, so the tiers below are only used as a fallback if it
          fails. Clear the formula to go back to using tiers.
        </p>
      )}
      <FeeTierTable initial={config} />
      <FeeFormulaEditor initial={formula} />
      <FeeCalculatorSimulator config={config} formula={formula} />
    </div>
  );
}
