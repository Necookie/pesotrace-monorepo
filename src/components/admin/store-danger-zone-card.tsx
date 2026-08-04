"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteStoreDialog } from "@/components/admin/delete-store-dialog";

export function StoreDangerZoneCard({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-down/30 bg-down/5 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-down">Danger zone</h2>
      <p className="mt-1 text-xs text-muted">These actions are permanent and cannot be undone.</p>

      <div className="mt-4 rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-semibold text-ink">Back up this store&apos;s data</h3>
        <p className="mt-1 text-xs text-muted">
          Downloads a CSV of every transaction for {storeName} — worth doing before a delete, but available any
          time.
        </p>
        <Button variant="outline" className="mt-3" render={<a href={`/admin/stores/${storeId}/export`} />}>
          <Download className="mr-1.5 size-3.5" />
          Export transactions (CSV)
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-semibold text-ink">Delete this store</h3>
        <p className="mt-1 text-xs text-muted">
          Permanently removes {storeName}, its staff, transactions, receipt images, and credit
          history. This cannot be undone.
        </p>
        <DeleteStoreDialog
          storeId={storeId}
          storeName={storeName}
          onDeleted={() => router.push("/admin")}
          trigger={
            <Button type="button" variant="destructive" className="mt-3">
              Delete store
            </Button>
          }
        />
      </div>
    </div>
  );
}
