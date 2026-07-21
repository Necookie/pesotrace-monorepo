"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requestTrialCredits } from "@/app/(app)/settings/actions";

export function RequestTrialCreditsCard({
  balance,
  hasPendingRequest,
}: {
  balance: number;
  hasPendingRequest: boolean;
}) {
  const [pending, setPending] = useState(hasPendingRequest);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest() {
    setSubmitting(true);
    const result = await requestTrialCredits();
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPending(true);
    toast.success("Trial request sent — we'll review it shortly");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">AI credits</h2>
      <p className="mt-1 text-xs text-muted">
        Credits power AI extraction for screenshot and statement uploads. Each image extraction
        costs about 1 credit; statement imports cost more since they process a full document.
      </p>

      <div className="mt-4">
        <p className="text-sm text-muted">Current balance</p>
        <p className={cn("mt-1 font-mono text-3xl font-semibold", balance <= 0 ? "text-down" : "text-ink")}>
          {balance.toLocaleString()}
        </p>
      </div>

      <Button type="button" className="mt-4" onClick={handleRequest} disabled={submitting || pending}>
        {pending ? "Trial request pending review" : submitting ? "Sending..." : "Request trial credits"}
      </Button>
    </div>
  );
}
