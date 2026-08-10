"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, X } from "lucide-react";
import { formatExtractionCost } from "@/lib/format";
import type { StoreExtractionFailures } from "@/lib/queries/admin";

const DISMISS_KEY = "admin:extraction-failures-dismissed";

/**
 * Only renders when there's something to see — a quiet week means no card,
 * not an empty one taking up space on the overview page.
 *
 * Adds a dismiss button that hides the panel for the current browser
 * session (via sessionStorage) so operators who've already reviewed
 * the failures aren't interrupted by the panel on every page load.
 * The panel re-appears automatically when a new failure is detected
 * (the total count changes).
 */
export function ExtractionFailuresPanel({ failures }: { failures: StoreExtractionFailures[] }) {
  const totalFailures = failures.reduce((sum, f) => sum + f.failureCount, 0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Re-show the panel whenever the failure count changes (new failures surfaced)
    const stored = sessionStorage.getItem(DISMISS_KEY);
    if (stored === String(totalFailures)) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, [totalFailures]);

  if (failures.length === 0 || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, String(totalFailures));
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl border border-down/30 bg-down/5 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-down/10 text-down">
          <AlertOctagon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {totalFailures} extraction failure{totalFailures === 1 ? "" : "s"} this week
            </h2>
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss until next failure"
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-down/10 hover:text-down transition-colors"
              aria-label="Dismiss extraction failures panel"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            Gemini still bills for a failed call — a spike here can mean a bad prompt or an API issue, not just
            bad screenshots.
          </p>

          <div className="mt-3 space-y-2">
            {failures.slice(0, 5).map((f) => (
              <Link
                key={f.storeId}
                href={`/admin/stores/${f.storeId}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm hover:border-down/40"
              >
                <span className="truncate text-ink">{f.storeName}</span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {f.failureCount} fail{f.failureCount === 1 ? "" : "s"}{" "}
                  {f.failureRatePct > 0 && (
                    <span className="text-down">({f.failureRatePct.toFixed(1)}%)</span>
                  )}{" "}
                  · {formatExtractionCost(f.wastedCostUsd)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
