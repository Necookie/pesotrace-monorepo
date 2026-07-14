"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { feeTierConfigSchema, type FeeTierConfig } from "@/lib/schemas/fee-tier";

export async function updateFeeTiers(config: FeeTierConfig) {
  const parsed = feeTierConfigSchema.safeParse(config);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid fee tier configuration" };
  }

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: profile } = await supabase.auth.getUser();
  if (!profile.user) return { ok: false as const, error: "Not authenticated" };

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profile.user.id)
    .single();

  if (myProfile?.role !== "owner" && myProfile?.role !== "manager") {
    return { ok: false as const, error: "Only owners or managers can edit fee tiers" };
  }

  const { error } = await supabase
    .from("stores")
    .update({ fee_tier_config: parsed.data })
    .eq("id", storeId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings/fee-tiers");
  return { ok: true as const };
}
