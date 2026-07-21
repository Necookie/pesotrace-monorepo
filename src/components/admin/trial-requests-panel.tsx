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
      <div className="mt-3 space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-wrap items-center gap-3 rounded-pill border border-hairline px-3 py-2"
          >
            <span className="font-medium text-ink">{request.storeName}</span>
            <span className="text-xs text-muted">Requested {formatDateTime(request.createdAt)}</span>
            <Input
              type="number"
              step="1"
              placeholder={String(DEFAULT_GRANT)}
              value={amounts[request.id] ?? ""}
              onChange={(e) => setAmounts((prev) => ({ ...prev, [request.id]: e.target.value }))}
              className="ml-auto w-24 font-mono"
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
        ))}
      </div>
    </div>
  );
}
