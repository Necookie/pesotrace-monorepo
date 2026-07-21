import { createAdminClient } from "@/lib/supabase/admin";
import { findInvitationByToken } from "@/lib/invitations/accept";
import { isInvitationAcceptable } from "@/lib/invitations/validation";
import { AcceptInviteCard } from "@/components/invite/accept-invite-card";

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();
  const invitation = await findInvitationByToken(supabase, token);

  if (!invitation || !isInvitationAcceptable(invitation.status, invitation.expires_at)) {
    return (
      <InviteShell>
        <h1 className="text-xl font-medium text-ink">This invite is no longer valid</h1>
        <p className="mt-2 text-sm text-body">
          It may have expired or already been used. Ask whoever invited you to send a new one.
        </p>
      </InviteShell>
    );
  }

  const { data: store } = await supabase.from("stores").select("name").eq("id", invitation.store_id).maybeSingle();

  return (
    <InviteShell>
      <AcceptInviteCard token={token} storeName={store?.name ?? "this store"} role={invitation.role} />
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-2xl border border-hairline p-6 text-center">{children}</div>
    </div>
  );
}
