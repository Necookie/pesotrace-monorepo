"use server";

import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findInvitationByToken, acceptInvitation } from "@/lib/invitations/accept";
import { trackServerEvent, ServerEvent } from "@/lib/analytics/events-server";

export async function acceptInviteAction(token: string) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };

  const supabase = createAdminClient();
  const invitation = await findInvitationByToken(supabase, token);
  if (!invitation) return { ok: false as const, error: "Invite not found" };

  const result = await acceptInvitation(supabase, invitation, user.id, user.fullName ?? null);
  if (!result.ok) return { ok: false as const, error: result.error };

  await trackServerEvent(ServerEvent.InviteAccepted, user.id, { storeId: result.storeId });

  return { ok: true as const };
}
