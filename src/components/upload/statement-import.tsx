"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { Amount } from "@/components/shared/amount";
import { formatDateTime, formatExtractionCost } from "@/lib/format";
import { statementRowToTransaction, type StatementRow } from "@/lib/schemas/statement";
import type { ReconciliationResult } from "@/lib/reconciliation";
import type { ExtractionCost } from "@/lib/gemini/pricing";
import { confirmStatementImport } from "@/app/(app)/upload/statement-actions";
import { cn } from "@/lib/utils";

type ParsedStatement = {
  rows: StatementRow[];
  reconciliation: ReconciliationResult[];
  sourceFileUrl: string;
  cost: ExtractionCost;
};

export function StatementImport() {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedStatement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    setParsing(true);
    setError(null);
    setParsed(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/extract-statement", { method: "POST", body: formData });
    const body = await res.json();
    setParsing(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to parse statement");
      return;
    }

    setParsed({
      rows: body.rows,
      reconciliation: body.reconciliation,
      sourceFileUrl: body.source_file_url,
      cost: body.cost,
    });
  }

  async function handleConfirmAll() {
    if (!parsed) return;
    setSubmitting(true);
    const result = await confirmStatementImport(parsed.rows, parsed.sourceFileUrl);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Imported ${result.insertedCount} transactions` +
        (result.skippedCount > 0 ? ` (${result.skippedCount} duplicates skipped)` : "") +
        (result.needsReviewCount > 0 ? ` — ${result.needsReviewCount} flagged for review` : "")
    );
    setParsed(null);
  }

  const mismatchCount = parsed?.reconciliation.filter((r) => r.mismatch).length ?? 0;

  return (
    <div className="space-y-4">
      {!parsed && (
        <div>
          <Dropzone multiple={false} onFiles={handleFile} kind="pdf" />
          <p className="mt-2 text-xs text-muted">Accepts a GCash Transaction History PDF export.</p>
          {parsing && <p className="mt-3 text-sm text-muted">Parsing statement...</p>}
          {error && <p className="mt-3 text-sm text-down">{error}</p>}
        </div>
      )}

      {parsed && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface-soft p-4">
            <div className="text-sm text-ink">
              <strong>{parsed.rows.length}</strong> transactions parsed
              {mismatchCount > 0 && (
                <span className="ml-2 text-down">
                  &middot; {mismatchCount} balance mismatch{mismatchCount > 1 ? "es" : ""} flagged for review
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-muted">
              {formatExtractionCost(parsed.cost.costUsd)}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-2xl border border-hairline">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-canvas">
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row, i) => {
                  const { direction, amount } = statementRowToTransaction(row);
                  const mismatch = parsed.reconciliation[i]?.mismatch;
                  return (
                    <tr
                      key={row.ref_number + i}
                      className={cn(
                        "border-b border-hairline last:border-0",
                        mismatch && "bg-surface-soft"
                      )}
                    >
                      <td className="px-3 py-2 text-xs text-muted">
                        {formatDateTime(row.occurred_at)}
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-xs text-body" title={row.description}>
                        {row.description}
                        {mismatch && <span className="ml-1 text-down">&middot; balance mismatch</span>}
                      </td>
                      <td className="px-3 py-2">
                        <CategoryBadge category={row.category} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Amount value={amount} direction={direction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirmAll} disabled={submitting} className="flex-1">
              {submitting ? "Importing..." : `Import all ${parsed.rows.length} transactions`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setParsed(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
