"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StorePhoneNumbers } from "@/lib/schemas/store-phone";
import { updateStorePhoneNumbers } from "@/app/(app)/settings/actions";

export function StorePhoneNumbersForm({ initial }: { initial: StorePhoneNumbers }) {
  const [numbers, setNumbers] = useState<string[]>(initial.length > 0 ? initial : [""]);
  const [saving, setSaving] = useState(false);

  function updateNumber(index: number, value: string) {
    setNumbers((prev) => prev.map((n, i) => (i === index ? value : n)));
  }

  function addNumber() {
    setNumbers((prev) => [...prev, ""]);
  }

  function removeNumber(index: number) {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const cleaned = numbers.map((n) => n.trim()).filter((n) => n.length > 0);
    setSaving(true);
    const result = await updateStorePhoneNumbers(cleaned);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setNumbers(cleaned.length > 0 ? cleaned : [""]);
    toast.success("Phone numbers updated");
  }

  return (
    <div className="rounded-2xl border border-hairline p-6">
      <h2 className="text-sm font-semibold text-ink">Store phone numbers</h2>
      <p className="mt-1 text-xs text-muted">
        Register the GCash-linked mobile numbers your store sends and receives from. When a
        receipt shows one of these numbers, extraction uses it to tell Cash In from Cash Out
        instead of guessing from the wording on the screenshot.
      </p>

      <div className="mt-4 space-y-2">
        {numbers.map((number, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="tel"
              value={number}
              placeholder="09171234567"
              onChange={(e) => updateNumber(i, e.target.value)}
              className="font-mono"
            />
            <button
              type="button"
              onClick={() => removeNumber(i)}
              className="flex size-8 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-strong hover:text-down"
              aria-label="Remove number"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" onClick={addNumber}>
          Add number
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
