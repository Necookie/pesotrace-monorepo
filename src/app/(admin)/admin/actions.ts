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
