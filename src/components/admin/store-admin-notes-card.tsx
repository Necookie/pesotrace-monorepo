"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateAdminNotes } from "@/app/(admin)/admin/actions";

/**
 * Support context only an operator sees — never rendered anywhere the store
 * owner can reach. Meant for things like "walked them through fee setup
 * 7/28, still confused about statement import" so the next person who picks
 * up a ticket isn't starting cold.
 */
export function StoreAdminNotesCard({ storeId, initialNotes }: { storeId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = notes !== (initialNotes ?? "");

  async function handleSave() {
    setSaving(true);
    const result = await updateAdminNotes({ storeId, notes });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Notes saved");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <StickyNote className="size-4 text-muted" />
        <h2 className="text-sm font-semibold text-ink">Admin notes</h2>
      </div>
      <p className="mt-1 text-xs text-muted">
        Only visible to platform admins — never shown to this store&apos;s owner or staff.
      </p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Support context for whoever picks up the next ticket..."
        className="mt-3 min-h-28"
      />
      <Button type="button" className="mt-3" onClick={handleSave} disabled={saving || !dirty}>
        {saving ? "Saving..." : "Save notes"}
      </Button>
    </div>
  );
}
