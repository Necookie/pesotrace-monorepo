"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStoreName } from "@/app/(admin)/admin/actions";

export function RenameStoreForm({ storeId, currentName }: { storeId: string; currentName: string }) {
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === currentName) return;

    setSaving(true);
    const result = await updateStoreName({ storeId, name });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Store renamed");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Store name</h2>
      <p className="mt-1.5 text-xs text-muted">Visible to this store&apos;s owner and staff throughout the app.</p>

      <div className="mt-5 space-y-1.5">
        <Label className="text-xs text-muted">Name</Label>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button type="submit" disabled={saving || name.trim() === currentName || name.trim().length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
