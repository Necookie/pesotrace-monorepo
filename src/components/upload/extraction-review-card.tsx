"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  extractedTransactionSchema,
  CATEGORY_LABELS,
  type ExtractedTransaction,
} from "@/lib/schemas/transaction";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { computeFee, matchTier, describeTier } from "@/lib/fees";
import type { ExtractionCost } from "@/lib/gemini/pricing";
import { formatExtractionCost } from "@/lib/format";
import { cn } from "@/lib/utils";

const reviewFormSchema = extractedTransactionSchema.extend({
  fee: z.coerce.number().min(0, "Fee can't be negative"),
  notes: z.string().max(500).nullable().optional(),
});

export type ReviewFormValues = ExtractedTransaction & { fee: number; notes: string | null };
type FormValues = z.input<typeof reviewFormSchema>;

export function ExtractionReviewCard({
  fileName,
  previewUrl,
  extracted,
  cost,
  feeTierConfig,
  submitting,
  onConfirm,
  onSkip,
}: {
  fileName: string;
  previewUrl: string;
  extracted: ExtractedTransaction;
  cost?: ExtractionCost;
  feeTierConfig: FeeTierConfig;
  submitting: boolean;
  onConfirm: (values: ReviewFormValues) => void;
  onSkip: () => void;
}) {
  const suggestedFee = computeFee(extracted.amount, feeTierConfig);
  const [feeTouched, setFeeTouched] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(reviewFormSchema) as Resolver<FormValues>,
    defaultValues: { ...extracted, fee: suggestedFee, notes: "" },
  });

  const watchedAmount = form.watch("amount");
  const watchedFee = form.watch("fee");

  useEffect(() => {
    form.reset({ ...extracted, fee: computeFee(extracted.amount, feeTierConfig) });
    setFeeTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted]);

  useEffect(() => {
    if (feeTouched) return;
    const amount = Number(watchedAmount) || 0;
    form.setValue("fee", computeFee(amount, feeTierConfig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAmount, feeTouched]);

  const needsReview = extracted.confidence < 0.85;
  const matchedTier = matchTier(Number(watchedAmount) || 0, feeTierConfig);
  const currentFeeMatchesSuggestion =
    Number(watchedFee) === computeFee(Number(watchedAmount) || 0, feeTierConfig);

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-hairline p-4 sm:p-6 md:grid-cols-2">
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
        onSubmit={form.handleSubmit((values) => {
          const parsed = reviewFormSchema.parse(values) as ReviewFormValues;
          onConfirm({ ...parsed, notes: parsed.notes?.trim() || null });
        })}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <select
              {...form.register("direction")}
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm md:h-8"
            >
              <option value="send">Send</option>
              <option value="receive">Receive</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
              {...form.register("category")}
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm md:h-8"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

        <div className="space-y-1.5">
          <Label>Charge / Service fee</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              className="font-mono"
              {...form.register("fee", {
                onChange: () => setFeeTouched(true),
              })}
            />
            {!currentFeeMatchesSuggestion && (
              <button
                type="button"
                onClick={() => {
                  form.setValue("fee", computeFee(Number(watchedAmount) || 0, feeTierConfig));
                  setFeeTouched(false);
                }}
                className="shrink-0 rounded-pill bg-surface-strong px-3 py-1.5 text-xs font-medium text-ink"
              >
                Use suggested
              </button>
            )}
          </div>
          <p className="text-xs text-muted">
            {matchedTier
              ? `Suggested from your fee tiers: ${describeTier(matchedTier)}`
              : "No matching fee tier — enter the charge manually."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Comment (optional)</Label>
          <textarea
            {...form.register("notes")}
            rows={2}
            placeholder="e.g. special rate for regular customer"
            className="w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
          />
        </div>

        <div
          className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t border-hairline bg-canvas px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pb-0"
        >
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
