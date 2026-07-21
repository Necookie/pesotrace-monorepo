"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateNotificationPrefs } from "@/app/(app)/settings/actions";
import type { NotificationPrefs } from "@/lib/database.types";

const TOGGLES: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  {
    key: "extractionFailed",
    label: "Failed extraction alerts",
    description: "Email me when a screenshot or statement upload fails to process.",
  },
  {
    key: "lowBalance",
    label: "Low-balance alerts",
    description: "Email me when this store's AI credit balance runs low or hits zero.",
  },
];

export function NotificationPrefsForm({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateNotificationPrefs(prefs);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Notification settings updated");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Email notifications</h2>
      <p className="mt-1 text-xs text-muted">Which emails this store&apos;s owner receives.</p>

      <div className="mt-4 space-y-3">
        {TOGGLES.map((toggle) => (
          <label
            key={toggle.key}
            className="flex items-start gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3"
          >
            <input
              type="checkbox"
              checked={prefs[toggle.key]}
              onChange={(e) => setPrefs((prev) => ({ ...prev, [toggle.key]: e.target.checked }))}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-ink">{toggle.label}</span>
              <span className="block text-xs text-muted">{toggle.description}</span>
            </span>
          </label>
        ))}
      </div>

      <Button type="button" className="mt-4" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
