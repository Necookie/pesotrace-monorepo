"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { sendEmail } from "@/lib/email/send";
import { StaffInviteEmail } from "@/components/email/templates/staff-invite";

const INVITE_EXPIRY_DAYS = 7;

const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: z.enum(["manager", "staff"]),
});

export async function createInvitation(input: { email: string; role: "manager" | "staff" }) {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (myProfile?.role !== "owner" && myProfile?.role !== "manager") {
    return { ok: false as const, error: "Only owners or managers can invite staff" };
  }
  if (parsed.data.role === "manager" && myProfile.role !== "owner") {
    return { ok: false as const, error: "Only the store owner can invite a manager" };
  }

  const { data: store } = await supabase.from("stores").select("name").eq("id", storeId).single();
  const storeName = store?.name ?? "your store";

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("invitations").insert({
    store_id: storeId,
    email: parsed.data.email,
    role: parsed.data.role,
    token,
    invited_by: userId,
    expires_at: expiresAt,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "There's already a pending invite for that email" };
    }
    return { ok: false as const, error: error.message };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/invite/${token}`;

  await sendEmail({
    to: parsed.data.email,
    subject: `You're invited to join ${storeName} on PesoTrace`,
    react: <StaffInviteEmail storeName={storeName} role={parsed.data.role} acceptUrl={acceptUrl} />,
  });

  revalidatePath("/settings/team");
  return { ok: true as const };
}

export async function revokeInvitation(invitationId: string) {
  const parsed = z.string().uuid().safeParse(invitationId);
  if (!parsed.success) return { ok: false as const, error: "Invalid invitation" };

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (myProfile?.role !== "owner" && myProfile?.role !== "manager") {
    return { ok: false as const, error: "Only owners or managers can revoke invites" };
  }

  const { error } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", parsed.data)
    .eq("store_id", storeId)
    .eq("status", "pending");

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings/team");
  return { ok: true as const };
}
