"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { feeTierConfigSchema, type FeeTierConfig } from "@/lib/schemas/fee-tier";
import { storePhoneNumbersSchema, type StorePhoneNumbers } from "@/lib/schemas/store-phone";

import { auth } from "@clerk/nextjs/server";

export async function updateFeeTiers(config: FeeTierConfig) {
  const parsed = feeTierConfigSchema.safeParse(config);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid fee tier configuration" };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
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

export async function updateStorePhoneNumbers(numbers: StorePhoneNumbers) {
  const parsed = storePhoneNumbersSchema.safeParse(numbers);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid phone number" };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (myProfile?.role !== "owner" && myProfile?.role !== "manager") {
    return { ok: false as const, error: "Only owners or managers can edit phone numbers" };
  }

  const dedup = [...new Set(parsed.data)];

  const { error } = await supabase
    .from("stores")
    .update({ phone_numbers: dedup })
    .eq("id", storeId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings/phone-numbers");
  return { ok: true as const };
}
