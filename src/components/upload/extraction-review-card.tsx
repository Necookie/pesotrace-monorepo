"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractedTransactionSchema, type ExtractedTransaction } from "@/lib/schemas/transaction";
import type { ExtractionCost } from "@/lib/gemini/pricing";
import { formatExtractionCost } from "@/lib/format";
import { cn } from "@/lib/utils";

type FormValues = z.input<typeof extractedTransactionSchema>;

export function ExtractionReviewCard({
  fileName,
  previewUrl,
  extracted,
  cost,
  submitting,
  onConfirm,
  onSkip,
}: {
  fileName: string;
  previewUrl: string;
  extracted: ExtractedTransaction;
  cost?: ExtractionCost;
  submitting: boolean;
  onConfirm: (values: ExtractedTransaction) => void;
  onSkip: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(extractedTransactionSchema) as Resolver<FormValues>,
    defaultValues: extracted,
  });

  useEffect(() => {
    form.reset(extracted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted]);

  const needsReview = extracted.confidence < 0.85;

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-hairline p-6 md:grid-cols-2">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={fileName}
          className="w-full rounded-xl border border-hairline object-contain"
        />
        <p className="mt-2 truncate text-xs text-muted">{fileName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-block rounded-pill px-2.5 py-1 text-xs font-medium",
              needsReview ? "bg-surface-strong text-down" : "bg-surface-strong text-up"
            )}
          >
            {needsReview ? "Needs review" : "High confidence"} (
            {Math.round(extracted.confidence * 100)}%)
          </span>
          {cost && (
            <span className="inline-block rounded-pill bg-surface-strong px-2.5 py-1 font-mono text-xs text-muted">
              {formatExtractionCost(cost.costUsd)} · {cost.inputTokens + cost.outputTokens} tokens
            </span>
          )}
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((values) =>
          onConfirm(extractedTransactionSchema.parse(values))
        )}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <select
              {...form.register("direction")}
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm"
            >
              <option value="send">Send</option>
              <option value="receive">Receive</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...form.register("amount")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Reference No.</Label>
          <Input {...form.register("ref_number")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Counterparty name</Label>
            <Input {...form.register("counterparty_name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Counterparty number</Label>
            <Input {...form.register("counterparty_number")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Date &amp; time</Label>
          <Input type="datetime-local" {...form.register("occurred_at")} />
        </div>

        <div className="mt-2 flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? "Saving..." : "Confirm"}
          </Button>
          <Button type="button" variant="outline" onClick={onSkip} disabled={submitting}>
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
}
