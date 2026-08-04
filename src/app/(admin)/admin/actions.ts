"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/monitoring-server";
import { notifyTrialApproved } from "@/app/(admin)/admin/notify";
import { trackServerEvent, ServerEvent } from "@/lib/analytics/events-server";
import { feeTierConfigSchema, type FeeTierConfig } from "@/lib/schemas/fee-tier";
import { validateFormula } from "@/lib/fee-formula-validate";
import type { AdminActionType, Json } from "@/lib/database.types";

/**
 * Best-effort audit log write — never blocks or fails the admin action it's
 * documenting. A logging failure is itself reported so it doesn't go
 * unnoticed, but the underlying action (already committed) still succeeds.
 */
async function logAdminAction(
  supabase: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  action: AdminActionType,
  storeId: string | null,
  targetSummary: string | null,
  metadata: Json = {}
) {
  const { error } = await supabase.rpc("log_admin_action", {
    p_actor_user_id: actorUserId,
    p_action: action,
    p_store_id: storeId,
    p_target_summary: targetSummary,
    p_metadata: metadata,
  });
  if (error) {
    await captureException(error, actorUserId, { context: "logAdminAction", action });
  }
}

const adjustCreditsSchema = z.object({
  storeId: z.string().uuid(),
  delta: z.number().refine((v) => v !== 0, "Amount can't be zero"),
  note: z.string().trim().min(1, "A note is required"),
});

export async function adjustStoreCredits(input: { storeId: string; delta: number; note: string }) {
  const parsed = adjustCreditsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("adjust_credit", {
    p_store_id: parsed.data.storeId,
    p_delta: parsed.data.delta,
    p_note: parsed.data.note,
    p_created_by: adminUserId,
  });

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "adjust_credit", parsed.data.storeId, parsed.data.note, {
    delta: parsed.data.delta,
  });

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

const updateStoreNameSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(1, "Store name can't be empty").max(120, "Store name is too long"),
});

export async function updateStoreName(input: { storeId: string; name: string }) {
  const parsed = updateStoreNameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { data: previous } = await supabase
    .from("stores")
    .select("name")
    .eq("id", parsed.data.storeId)
    .maybeSingle();

  const { error } = await supabase
    .from("stores")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.storeId);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "update_store_name", parsed.data.storeId, parsed.data.name, {
    previousName: previous?.name ?? null,
    newName: parsed.data.name,
  });

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

const suspendStoreSchema = z.object({
  storeId: z.string().uuid(),
  reason: z.string().trim().min(1, "A reason is required").max(500, "Reason is too long"),
});

/**
 * Blocks a store's extraction access without the irreversible full delete —
 * for abuse, non-payment, or an investigation, where the store's data and
 * history need to stay intact.
 */
export async function suspendStore(input: { storeId: string; reason: string }) {
  const parsed = suspendStoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stores")
    .update({ suspended: true, suspended_at: new Date().toISOString(), suspended_reason: parsed.data.reason })
    .eq("id", parsed.data.storeId);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "suspend_store", parsed.data.storeId, parsed.data.reason);

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function unsuspendStore(storeId: string) {
  const parsed = z.string().uuid().safeParse(storeId);
  if (!parsed.success) return { ok: false as const, error: "Invalid store" };

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stores")
    .update({ suspended: false, suspended_at: null, suspended_reason: null })
    .eq("id", parsed.data);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "unsuspend_store", parsed.data, null);

  revalidatePath(`/admin/stores/${parsed.data}`);
  revalidatePath("/admin");
  return { ok: true as const };
}

const updateAdminNotesSchema = z.object({
  storeId: z.string().uuid(),
  notes: z.string().trim().max(5000, "Notes are too long"),
});

/**
 * Admin-only support notes — never surfaced to the store owner. Purely for
 * operator context, so a note is worth writing even when it's just clearing
 * one out (empty string is a valid save, not an error).
 */
export async function updateAdminNotes(input: { storeId: string; notes: string }) {
  const parsed = updateAdminNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const notes = parsed.data.notes.length > 0 ? parsed.data.notes : null;

  const { error } = await supabase.from("stores").update({ admin_notes: notes }).eq("id", parsed.data.storeId);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "update_admin_notes", parsed.data.storeId, null);

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  return { ok: true as const };
}

const updateStoreFeeConfigSchema = z.object({
  storeId: z.string().uuid(),
  tiers: feeTierConfigSchema,
  formula: z.string().nullable(),
});

/**
 * Lets a platform admin fix a store's fee setup on the owner's behalf — the
 * store owners are non-technical, and a wrong fee schedule costs them money
 * on every transaction until someone corrects it.
 *
 * Runs the same formula validation the store-side action does, so support
 * cannot save a rule the owner would have been blocked from saving. Always
 * audit-logged with the previous config, since this is one account changing
 * another's pricing.
 */
export async function updateStoreFeeConfig(input: {
  storeId: string;
  tiers: FeeTierConfig;
  formula: string | null;
}) {
  const parsed = updateStoreFeeConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const trimmed = parsed.data.formula?.trim() ?? "";
  const formula = trimmed === "" ? null : trimmed;

  if (formula !== null) {
    const validation = validateFormula(formula);
    if (!validation.ok) {
      return { ok: false as const, error: validation.error };
    }
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { data: previous } = await supabase
    .from("stores")
    .select("fee_tier_config, fee_formula")
    .eq("id", parsed.data.storeId)
    .maybeSingle();

  const { error } = await supabase
    .from("stores")
    .update({ fee_tier_config: parsed.data.tiers, fee_formula: formula })
    .eq("id", parsed.data.storeId);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(
    supabase,
    adminUserId,
    "update_fee_tiers",
    parsed.data.storeId,
    formula ? "Set custom fee formula" : `${parsed.data.tiers.length} fee tier(s)`,
    {
      previousTiers: previous?.fee_tier_config ?? null,
      previousFormula: previous?.fee_formula ?? null,
      newTiers: parsed.data.tiers,
      newFormula: formula,
    } as Json
  );

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  return { ok: true as const };
}

const approveRequestSchema = z.object({
  requestId: z.string().uuid(),
  grantAmount: z.number().positive("Grant amount must be greater than zero"),
});

export async function approveCreditRequest(input: { requestId: string; grantAmount: number }) {
  const parsed = approveRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  // Claim the request atomically BEFORE granting: the status guard lives in
  // the UPDATE, so a double-click or a second operator can't both pass a
  // separate status check and each grant credits. If no row comes back, it
  // was already decided (or doesn't exist).
  const { data: request, error: claimError } = await supabase
    .from("credit_requests")
    .update({ status: "approved", decided_by: adminUserId, decided_at: new Date().toISOString() })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending")
    .select("store_id")
    .maybeSingle();

  if (claimError) return { ok: false as const, error: claimError.message };
  if (!request) {
    return { ok: false as const, error: "This request has already been decided" };
  }

  const { error: grantError } = await supabase.rpc("adjust_credit", {
    p_store_id: request.store_id,
    p_delta: parsed.data.grantAmount,
    p_note: "Trial request approved",
    p_created_by: adminUserId,
    p_entry_type: "grant",
  });
  if (grantError) {
    // Release the claim so the request can be retried rather than being
    // stuck "approved" with no credits actually granted.
    await supabase
      .from("credit_requests")
      .update({ status: "pending", decided_by: null, decided_at: null })
      .eq("id", parsed.data.requestId);
    return { ok: false as const, error: grantError.message };
  }

  await logAdminAction(supabase, adminUserId, "approve_request", request.store_id, null, {
    requestId: parsed.data.requestId,
    grantAmount: parsed.data.grantAmount,
  });
  await notifyTrialApproved(supabase, request.store_id, parsed.data.grantAmount);
  await trackServerEvent(ServerEvent.TrialRequestApproved, adminUserId, {
    storeId: request.store_id,
    grantAmount: parsed.data.grantAmount,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${request.store_id}`);
  return { ok: true as const };
}

export async function denyCreditRequest(requestId: string) {
  const parsed = z.string().uuid().safeParse(requestId);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { data: request, error } = await supabase
    .from("credit_requests")
    .update({ status: "denied", decided_by: adminUserId, decided_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("status", "pending")
    .select("store_id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "deny_request", request.store_id, null, {
    requestId: parsed.data,
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

const STORAGE_LIST_PAGE_SIZE = 1000;

async function deleteStoreStorageFiles(
  supabase: ReturnType<typeof createAdminClient>,
  storeId: string
) {
  let offset = 0;
  for (;;) {
    const { data: files, error } = await supabase.storage
      .from("transaction-sources")
      .list(storeId, { limit: STORAGE_LIST_PAGE_SIZE, offset });
    if (error) throw error;
    if (!files || files.length === 0) break;

    const paths = files.map((f) => `${storeId}/${f.name}`);
    const { error: removeError } = await supabase.storage.from("transaction-sources").remove(paths);
    if (removeError) throw removeError;

    if (files.length < STORAGE_LIST_PAGE_SIZE) break;
    offset += STORAGE_LIST_PAGE_SIZE;
  }
}

const deleteStoreSchema = z.object({
  storeId: z.string().uuid(),
  confirmName: z.string(),
});

export async function deleteStore(input: { storeId: string; confirmName: string }) {
  const parsed = deleteStoreSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { data: store, error: fetchError } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", parsed.data.storeId)
    .single();
  if (fetchError) return { ok: false as const, error: fetchError.message };

  if (parsed.data.confirmName !== store.name) {
    return { ok: false as const, error: "Store name did not match" };
  }

  // Snapshot what the FK cascade is about to destroy — the cascade wipes
  // credit_ledger/transactions/etc, so this is the only record left that
  // the deletion happened and what it took with it.
  const [{ count: transactionCount }, { data: credits }] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).eq("store_id", parsed.data.storeId),
    supabase.from("store_credits").select("balance").eq("store_id", parsed.data.storeId).maybeSingle(),
  ]);

  try {
    await deleteStoreStorageFiles(supabase, parsed.data.storeId);
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? `Failed to clean up storage: ${e.message}` : "Failed to clean up storage",
    };
  }

  await logAdminAction(supabase, adminUserId, "delete_store", parsed.data.storeId, store.name, {
    storeName: store.name,
    transactionCount: transactionCount ?? 0,
    creditBalanceAtDeletion: credits?.balance ?? 0,
  });

  // FK cascades (profiles, transactions, store_credits, credit_ledger,
  // credit_requests -> stores) remove everything else in one statement.
  // The audit log row above survives it (store_id -> on delete set null).
  const { error: deleteError } = await supabase.from("stores").delete().eq("id", parsed.data.storeId);
  if (deleteError) return { ok: false as const, error: deleteError.message };

  await trackServerEvent(ServerEvent.StoreDeleted, adminUserId, { storeName: store.name });

  revalidatePath("/admin");
  return { ok: true as const };
}

const updatePlatformSettingsSchema = z.object({
  lowBalanceThreshold: z.number().min(0, "Threshold can't be negative").max(100000, "That's not a realistic threshold"),
});

/**
 * The low-balance cron reads this on every run — moving it here instead of
 * a hardcoded constant means bumping the threshold no longer needs a code
 * change and a deploy.
 */
export async function updatePlatformSettings(input: { lowBalanceThreshold: number }) {
  const parsed = updatePlatformSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { data: previous } = await supabase
    .from("platform_settings")
    .select("low_balance_threshold")
    .eq("id", true)
    .maybeSingle();

  const { error } = await supabase
    .from("platform_settings")
    .update({
      low_balance_threshold: parsed.data.lowBalanceThreshold,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    })
    .eq("id", true);

  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(
    supabase,
    adminUserId,
    "update_platform_settings",
    null,
    `Low-balance threshold ${parsed.data.lowBalanceThreshold}`,
    {
      previousLowBalanceThreshold: previous?.low_balance_threshold ?? null,
      newLowBalanceThreshold: parsed.data.lowBalanceThreshold,
    }
  );

  revalidatePath("/admin/settings");
  return { ok: true as const };
}

const bulkAdjustCreditsSchema = z.object({
  storeIds: z.array(z.string().uuid()).min(1, "Select at least one store"),
  delta: z.number().refine((v) => v !== 0, "Amount can't be zero"),
  note: z.string().trim().min(1, "A note is required"),
});

/**
 * Grants (or deducts) the same amount across many stores at once — a promo
 * to a batch of trial stores, say — instead of the same adjustment repeated
 * one store at a time. Each store still gets its own credit_ledger row via
 * adjust_credit; only the audit log entry is a single summary rather than
 * one per store, since they're all one operator decision.
 */
export async function bulkAdjustCredits(input: { storeIds: string[]; delta: number; note: string }) {
  const parsed = bulkAdjustCreditsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const results = await Promise.all(
    parsed.data.storeIds.map(async (storeId) => {
      const { error } = await supabase.rpc("adjust_credit", {
        p_store_id: storeId,
        p_delta: parsed.data.delta,
        p_note: parsed.data.note,
        p_created_by: adminUserId,
      });
      return { storeId, ok: !error };
    })
  );

  const succeededIds = results.filter((r) => r.ok).map((r) => r.storeId);
  const failedCount = results.length - succeededIds.length;

  if (succeededIds.length > 0) {
    await logAdminAction(supabase, adminUserId, "bulk_grant_credits", null, parsed.data.note, {
      storeIds: succeededIds,
      delta: parsed.data.delta,
      succeededCount: succeededIds.length,
      failedCount,
    });
  }

  revalidatePath("/admin");

  if (failedCount > 0) {
    return {
      ok: false as const,
      error: `${succeededIds.length} of ${results.length} succeeded — ${failedCount} failed`,
    };
  }
  return { ok: true as const, succeededCount: succeededIds.length };
}
