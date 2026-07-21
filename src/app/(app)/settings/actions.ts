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

export async function requestTrialCredits() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: existing } = await supabase
    .from("credit_requests")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { ok: false as const, error: "You already have a trial request pending review" };
  }

  const { error } = await supabase
    .from("credit_requests")
    .insert({ store_id: storeId, requested_by: userId });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings/credits");
  return { ok: true as const };
}

export async function clearTransactionHistory(confirmation: string) {
  if (confirmation !== "DELETE") {
    return { ok: false as const, error: "Confirmation text did not match" };
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

  if (myProfile?.role !== "owner") {
    return { ok: false as const, error: "Only the store owner can clear transaction history" };
  }

  const { data: rows, error: fetchError } = await supabase
    .from("transactions")
    .select("source_file_url")
    .eq("store_id", storeId);

  if (fetchError) return { ok: false as const, error: fetchError.message };

  const paths = (rows ?? [])
    .map((row) => row.source_file_url)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("transaction-sources")
      .remove(paths);
    // Storage cleanup failures shouldn't block clearing the ledger rows —
    // orphaned files are a cheap tradeoff versus stuck history.
    if (storageError) console.error("Failed to remove transaction source files:", storageError.message);
  }

  const { error, count } = await supabase
    .from("transactions")
    .delete({ count: "exact" })
    .eq("store_id", storeId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/ledger");
  revalidatePath("/dashboard");
  revalidatePath("/settings/danger-zone");
  return { ok: true as const, count: count ?? 0 };
}
