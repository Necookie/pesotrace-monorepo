"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

  revalidatePath(`/admin/stores/${parsed.data.storeId}`);
  revalidatePath("/admin");
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

  const { data: request, error: fetchError } = await supabase
    .from("credit_requests")
    .select("id, store_id, status")
    .eq("id", parsed.data.requestId)
    .single();

  if (fetchError) return { ok: false as const, error: fetchError.message };
  if (request.status !== "pending") {
    return { ok: false as const, error: "This request has already been decided" };
  }

  const { error: grantError } = await supabase.rpc("adjust_credit", {
    p_store_id: request.store_id,
    p_delta: parsed.data.grantAmount,
    p_note: "Trial request approved",
    p_created_by: adminUserId,
    p_entry_type: "grant",
  });
  if (grantError) return { ok: false as const, error: grantError.message };

  const { error: updateError } = await supabase
    .from("credit_requests")
    .update({ status: "approved", decided_by: adminUserId, decided_at: new Date().toISOString() })
    .eq("id", parsed.data.requestId);
  if (updateError) return { ok: false as const, error: updateError.message };

  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${request.store_id}`);
  return { ok: true as const };
}

export async function denyCreditRequest(requestId: string) {
  const parsed = z.string().uuid().safeParse(requestId);
  if (!parsed.success) return { ok: false as const, error: "Invalid request" };

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("credit_requests")
    .update({ status: "denied", decided_by: adminUserId, decided_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("status", "pending");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin");
  return { ok: true as const };
}
