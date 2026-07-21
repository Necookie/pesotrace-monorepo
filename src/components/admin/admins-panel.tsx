"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { grantPlatformAdmin, revokePlatformAdmin } from "@/app/(admin)/admin/admins/actions";

type AdminRow = { userId: string; addedBy: string; note: string | null; createdAt: string };

export function AdminsPanel({ admins }: { admins: AdminRow[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await grantPlatformAdmin({ userId, note });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUserId("");
    setNote("");
    toast.success("Admin added");
    router.refresh();
  }

  async function handleRevoke(targetUserId: string) {
    setBusyId(targetUserId);
    const result = await revokePlatformAdmin(targetUserId);
    setBusyId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Admin removed");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-hairline p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">DB-managed admins</h2>
        <div className="mt-4 space-y-2">
          {admins.map((admin) => (
            <div
              key={admin.userId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-ink">{admin.userId}</p>
                <p className="text-xs text-muted">
                  {admin.note ?? "No note"} · added {admin.createdAt}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleRevoke(admin.userId)}
                disabled={busyId === admin.userId}
              >
                Remove
              </Button>
            </div>
          ))}
          {admins.length === 0 && <p className="text-sm text-muted">No DB-managed admins yet.</p>}
        </div>
      </div>

      <form onSubmit={handleGrant} className="rounded-2xl border border-hairline p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Add an admin</h2>
        <p className="mt-1.5 text-xs text-muted">
          Find the Clerk user ID in the Clerk dashboard under Users.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted">Clerk user ID</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_..."
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted">Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why they're an admin" />
          </div>
        </div>

        <Button type="submit" className="mt-5" disabled={saving}>
          {saving ? "Adding..." : "Add admin"}
        </Button>
      </form>
    </div>
  );
}
