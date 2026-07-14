"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dropzone } from "@/components/upload/dropzone";
import { ExtractionReviewCard } from "@/components/upload/extraction-review-card";
import type { ExtractedTransaction } from "@/lib/schemas/transaction";
import { confirmTransaction } from "./actions";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: "extracting" | "ready" | "error" | "done";
  extracted?: ExtractedTransaction;
  sourceFileUrl?: string;
  error?: string;
};

async function extractOne(file: File): Promise<{
  extracted?: ExtractedTransaction;
  sourceFileUrl?: string;
  error?: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract", { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) {
    return { error: body.error ?? "Extraction failed", sourceFileUrl: body.source_file_url };
  }
  return { extracted: body.extracted, sourceFileUrl: body.source_file_url };
}

export function UploadFlow() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function handleFiles(files: File[]) {
    const newItems: QueueItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "extracting",
    }));
    setQueue((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      const result = await extractOne(item.file);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: result.extracted ? "ready" : "error",
                extracted: result.extracted,
                sourceFileUrl: result.sourceFileUrl,
                error: result.error,
              }
            : q
        )
      );
    }
  }

  async function handleConfirm(item: QueueItem, values: ExtractedTransaction) {
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
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
  }

  function handleSkip(item: QueueItem) {
    setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
  }

  const pendingReview = queue.filter((q) => q.status === "ready");
  const extracting = queue.filter((q) => q.status === "extracting");
  const errors = queue.filter((q) => q.status === "error");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-medium text-ink">Upload Transactions</h1>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single Image</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Images</TabsTrigger>
          <TabsTrigger value="statement" disabled>
            Import Statement (coming soon)
          </TabsTrigger>
        </TabsList>
        <TabsContent value="single">
          <div className="mt-4">
            <Dropzone multiple={false} onFiles={handleFiles} />
          </div>
        </TabsContent>
        <TabsContent value="bulk">
          <div className="mt-4">
            <Dropzone multiple onFiles={handleFiles} />
          </div>
        </TabsContent>
        <TabsContent value="statement">
          <div className="mt-4 rounded-2xl border border-hairline p-8 text-center text-sm text-muted">
            Bulk statement (PDF/CSV) import is coming soon.
          </div>
        </TabsContent>
      </Tabs>

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
