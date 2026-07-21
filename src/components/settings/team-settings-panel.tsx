"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createInvitation, revokeInvitation } from "@/app/(app)/settings/team-actions";
import type { ProfileRole } from "@/lib/database.types";

type Member = { id: string; full_name: string | null; role: ProfileRole };
type PendingInvite = { id: string; email: string; role: ProfileRole; expires_at: string; created_at: string };

const ROLE_LABEL: Record<ProfileRole, string> = { owner: "Owner", manager: "Manager", staff: "Staff" };

export function TeamSettingsPanel({
  members,
  pendingInvites,
  myUserId,
  myRole,
}: {
  members: Member[];
  pendingInvites: PendingInvite[];
  myUserId: string;
  myRole: ProfileRole;
}) {
  const canManage = myRole === "owner" || myRole === "manager";
  const canInviteManagers = myRole === "owner";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Team members</h2>
        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-hairline bg-canvas px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {member.full_name || "Unnamed"}
                  {member.id === myUserId && <span className="ml-2 text-xs text-muted">(you)</span>}
                </p>
              </div>
              <span className="rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium text-ink">
                {ROLE_LABEL[member.role]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {canManage && (
        <>
          {pendingInvites.length > 0 && (
            <div className="rounded-2xl border border-hairline p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">Pending invites</h2>
              <div className="mt-4 space-y-2">
                {pendingInvites.map((invite) => (
                  <PendingInviteRow key={invite.id} invite={invite} />
                ))}
              </div>
            </div>
          )}

          <InviteForm canInviteManagers={canInviteManagers} />
        </>
      )}
    </div>
  );
}

function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    const result = await revokeInvitation(invite.id);
    setRevoking(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Invite revoked");
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{invite.email}</p>
        <p className="text-xs text-muted">
          Invited as {ROLE_LABEL[invite.role].toLowerCase()} · expires {formatDateTime(invite.expires_at)}
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={handleRevoke} disabled={revoking}>
        {revoking ? "Revoking..." : "Revoke"}
      </Button>
    </div>
  );
}

function InviteForm({ canInviteManagers }: { canInviteManagers: boolean }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"staff" | "manager">("staff");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    const result = await createInvitation({ email, role });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setEmail("");
    setRole("staff");
    toast.success("Invite sent");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Invite someone</h2>
      <p className="mt-1.5 text-xs text-muted">They&apos;ll get an email with a link to join this store.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted">Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@email.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted">Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "staff" | "manager")}
            className={cn("h-10 w-full rounded-md border border-hairline bg-canvas px-2 text-sm")}
          >
            <option value="staff">Staff</option>
            {canInviteManagers && <option value="manager">Manager</option>}
          </select>
        </div>
      </div>

      <Button type="submit" className="mt-5" disabled={sending}>
        {sending ? "Sending..." : "Send invite"}
      </Button>
    </form>
  );
}
