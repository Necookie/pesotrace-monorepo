"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/monitoring-server";
import type { Json } from "@/lib/database.types";

async function logAdminAction(
  supabase: ReturnType<typeof createAdminClient>,
  actorUserId: string,
  action: "grant_admin" | "revoke_admin",
  targetSummary: string,
  metadata: Json = {}
) {
  const { error } = await supabase.rpc("log_admin_action", {
    p_actor_user_id: actorUserId,
    p_action: action,
    p_store_id: null,
    p_target_summary: targetSummary,
    p_metadata: metadata,
  });
  if (error) {
    await captureException(error, actorUserId, { context: "logAdminAction", action });
  }
}

const grantAdminSchema = z.object({
  userId: z.string().trim().min(1, "Enter a Clerk user ID"),
  note: z.string().trim().min(1, "A note is required"),
});

export async function grantPlatformAdmin(input: { userId: string; note: string }) {
  const parsed = grantAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const adminUserId = await requirePlatformAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("platform_admins").insert({
    user_id: parsed.data.userId,
    added_by: adminUserId,
    note: parsed.data.note,
  });

  if (error) {
    if (error.code === "23505") return { ok: false as const, error: "That user is already an admin" };
    return { ok: false as const, error: error.message };
  }

  await logAdminAction(supabase, adminUserId, "grant_admin", parsed.data.userId, { note: parsed.data.note });

  revalidatePath("/admin/admins");
  return { ok: true as const };
}

export async function revokePlatformAdmin(userId: string) {
  const parsed = z.string().trim().min(1).safeParse(userId);
  if (!parsed.success) return { ok: false as const, error: "Invalid user" };

  const adminUserId = await requirePlatformAdmin();
  if (parsed.data === adminUserId) {
    return { ok: false as const, error: "You can't revoke your own admin access" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("platform_admins").delete().eq("user_id", parsed.data);
  if (error) return { ok: false as const, error: error.message };

  await logAdminAction(supabase, adminUserId, "revoke_admin", parsed.data);

  revalidatePath("/admin/admins");
  return { ok: true as const };
}
