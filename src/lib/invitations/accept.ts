import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { isInvitationAcceptable } from "@/lib/invitations/validation";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

export async function findInvitationByToken(
  supabase: SupabaseClient<Database>,
  token: string
): Promise<InvitationRow | null> {
  const { data } = await supabase.from("invitations").select("*").eq("token", token).maybeSingle();
  return data;
}

export async function findPendingInvitationByEmail(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<InvitationRow | null> {
  const normalized = email.trim().toLowerCase();
  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("email", normalized)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || !isInvitationAcceptable(data.status, data.expires_at)) return null;
  return data;
}

export type AcceptInvitationResult =
  | { ok: true; storeId: string }
  | { ok: false; error: string };

/**
 * Joins an already-signed-in Clerk user into the invitation's store. Must
 * run against the admin client — the acceptor has no profile row yet, so
 * RLS (which reads profiles to resolve current_store_id()) can't see them.
 */
export async function acceptInvitation(
  supabase: SupabaseClient<Database>,
  invitation: InvitationRow,
  clerkUserId: string,
  fullName: string | null
): Promise<AcceptInvitationResult> {
  if (!isInvitationAcceptable(invitation.status, invitation.expires_at)) {
    return { ok: false, error: "This invite has expired or was already used" };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", clerkUserId)
    .maybeSingle();

  if (existingProfile) {
    return {
      ok: false,
      error:
        existingProfile.store_id === invitation.store_id
          ? "You're already a member of this store"
          : "You already belong to a different store",
    };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: clerkUserId,
    store_id: invitation.store_id,
    role: invitation.role,
    full_name: fullName,
  });
  if (profileError) return { ok: false, error: profileError.message };

  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_by: clerkUserId })
    .eq("id", invitation.id);

  return { ok: true, storeId: invitation.store_id };
}
