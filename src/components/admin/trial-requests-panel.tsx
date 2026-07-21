"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { approveCreditRequest, denyCreditRequest } from "@/app/(admin)/admin/actions";
import type { PendingCreditRequest } from "@/lib/queries/admin";

const DEFAULT_GRANT = 50;

export function TrialRequestsPanel({ requests }: { requests: PendingCreditRequest[] }) {
  const router = useRouter();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handleApprove(requestId: string) {
    const raw = amounts[requestId] ?? String(DEFAULT_GRANT);
    const grantAmount = Number(raw);
    if (!Number.isFinite(grantAmount) || grantAmount <= 0) {
      toast.error("Enter a grant amount greater than zero");
      return;
    }

    setPendingId(requestId);
    const result = await approveCreditRequest({ requestId, grantAmount });
    setPendingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Trial approved");
    router.refresh();
  }

  async function handleDeny(requestId: string) {
    setPendingId(requestId);
    const result = await denyCreditRequest(requestId);
    setPendingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Request denied");
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Pending trial requests</h2>
      <p className="mt-1.5 text-xs text-muted">
        Approve to grant the amount below via a &ldquo;grant&rdquo; ledger entry, or deny to dismiss.
      </p>
      <div className="mt-4 space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{request.storeName}</p>
              <p className="text-xs text-muted">Requested {formatDateTime(request.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1"
                placeholder={String(DEFAULT_GRANT)}
                value={amounts[request.id] ?? ""}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [request.id]: e.target.value }))}
                className="w-24 font-mono"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleApprove(request.id)}
                disabled={pendingId === request.id}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleDeny(request.id)}
                disabled={pendingId === request.id}
              >
                Deny
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
