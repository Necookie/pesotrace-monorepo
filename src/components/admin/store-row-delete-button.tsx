"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DeleteStoreDialog } from "@/components/admin/delete-store-dialog";

export function StoreRowDeleteButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();

  return (
    <DeleteStoreDialog
      storeId={storeId}
      storeName={storeName}
      onDeleted={() => router.refresh()}
      trigger={
        <button
          type="button"
          aria-label={`Delete ${storeName}`}
          className="flex size-11 items-center justify-center rounded-pill text-muted hover:bg-down/10 hover:text-down"
        >
          <Trash2 className="size-4" />
        </button>
      }
    />
  );
}
