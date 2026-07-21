"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/upload/dropzone";
import { ExtractionReviewCard, type ReviewFormValues } from "@/components/upload/extraction-review-card";
import { StatementImport } from "@/components/upload/statement-import";
import { cn } from "@/lib/utils";
import type { ExtractedTransaction } from "@/lib/schemas/transaction";
import type { ExtractionCost } from "@/lib/gemini/pricing";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { formatExtractionCost } from "@/lib/format";
import { confirmTransaction, deleteUploadedSource } from "./actions";
import { trackEvent, ClientEvent } from "@/lib/analytics/events";

type UploadTab = "single" | "bulk" | "statement";

// Caps how many extraction calls run at once during a bulk upload — plain
// Promise.all over the whole batch would fire dozens of Gemini/Storage
// requests simultaneously.
const BULK_EXTRACT_CONCURRENCY = 4;

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "extracting" | "ready" | "error" | "done";
  extracted?: ExtractedTransaction;
  sourceFileUrl?: string;
  error?: string;
  cost?: ExtractionCost;
};

async function extractOne(file: File): Promise<{
  extracted?: ExtractedTransaction;
  sourceFileUrl?: string;
  error?: string;
  cost?: ExtractionCost;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract", { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) {
    return {
      error: body.error ?? "Extraction failed",
      sourceFileUrl: body.source_file_url,
      cost: body.cost,
    };
  }
  return { extracted: body.extracted, sourceFileUrl: body.source_file_url, cost: body.cost };
}

export function UploadFlow({ feeTierConfig }: { feeTierConfig: FeeTierConfig }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [tab, setTab] = useState<UploadTab>("single");

  async function handleFiles(files: File[]) {
    trackEvent(ClientEvent.UploadStarted, { count: files.length });

    const newItems: QueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "extracting",
    }));
    setQueue((prev) => [...prev, ...newItems]);

    await mapWithConcurrency(newItems, BULK_EXTRACT_CONCURRENCY, async (item) => {
      const result = await extractOne(item.file);
      trackEvent(result.extracted ? ClientEvent.ExtractionSucceeded : ClientEvent.ExtractionFailedShown);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: result.extracted ? "ready" : "error",
                extracted: result.extracted,
                sourceFileUrl: result.sourceFileUrl,
                error: result.error,
                cost: result.cost,
              }
            : q
        )
      );
    });
  }

  async function handleConfirm(item: QueueItem, values: ReviewFormValues) {
    setSubmittingId(item.id);
    const result = await confirmTransaction({
      ...values,
      source_type: "screenshot",
      source_file_url: item.sourceFileUrl ?? null,
    });
    setSubmittingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Transaction saved");
    trackEvent(ClientEvent.TransactionConfirmed);
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
  }

  function handleSkip(item: QueueItem) {
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
    if (item.sourceFileUrl) {
      // Fire-and-forget: the skipped screenshot has no transaction row
      // referencing it, so leaving it in storage would just orphan it.
      deleteUploadedSource(item.sourceFileUrl);
    }
  }

  const pendingReview = queue.filter((q) => q.status === "ready");
  const extracting = queue.filter((q) => q.status === "extracting");
  const errors = queue.filter((q) => q.status === "error");
  const batchCostUsd = queue.reduce((sum, q) => sum + (q.cost?.costUsd ?? 0), 0);
  const processedCount = queue.filter((q) => q.cost).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-medium text-ink">Upload Transactions</h1>
        {processedCount > 0 && (
          <span className="rounded-pill bg-surface-strong px-3 py-1.5 text-xs font-mono text-muted">
            {processedCount} image{processedCount > 1 ? "s" : ""} · {formatExtractionCost(batchCostUsd)} this batch
          </span>
        )}
      </div>

      <div className="flex w-full gap-1 overflow-x-auto rounded-pill bg-surface-strong p-1 sm:w-fit">
        {(
          [
            { value: "single", label: "Single Image" },
            { value: "bulk", label: "Bulk Images" },
            { value: "statement", label: "Import Statement" },
          ] as const
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              tab === t.value ? "bg-canvas text-ink shadow-sm" : "text-body"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "single" && (
        <div className="mt-4">
          <Dropzone multiple={false} onFiles={handleFiles} />
        </div>
      )}
      {tab === "bulk" && (
        <div className="mt-4">
          <Dropzone multiple onFiles={handleFiles} />
        </div>
      )}
      {tab === "statement" && (
        <div className="mt-4">
          <StatementImport />
        </div>
      )}

      {extracting.length > 0 && (
        <p className="text-sm text-muted">
          Extracting {extracting.length} image{extracting.length > 1 ? "s" : ""}...
        </p>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-hairline bg-surface-soft p-4 text-sm text-down"
            >
              {item.file.name}: {item.error}
            </div>
          ))}
        </div>
      )}

      {pendingReview.length > 0 && (
        <div className="space-y-4">
          {pendingReview.slice(0, 1).map((item) => (
            <ExtractionReviewCard
              key={item.id}
              fileName={item.file.name}
              previewUrl={item.previewUrl}
              extracted={item.extracted!}
              cost={item.cost}
              feeTierConfig={feeTierConfig}
              submitting={submittingId === item.id}
              onConfirm={(values) => handleConfirm(item, values)}
              onSkip={() => handleSkip(item)}
            />
          ))}
          {pendingReview.length > 1 && (
            <p className="text-sm text-muted">
              {pendingReview.length - 1} more waiting for review...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
