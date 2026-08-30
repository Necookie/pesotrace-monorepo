"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, Info, X } from "lucide-react";
import { formatExtractionCost } from "@/lib/format";
import type { StoreExtractionFailures } from "@/lib/queries/admin";

const DISMISS_KEY = "admin:extraction-failures-dismissed";

/**
 * Only renders when there's something to see — a quiet week means no card,
 * not an empty one taking up space on the overview page.
 *
 * Distinguishes between normal isolated user noise (< 5% failure rate) and
 * true systemic spikes (≥ 5% or multiple failures), styling appropriately so
 * operators aren't alarmed by a single blurry receipt.
 */
export function ExtractionFailuresPanel({ failures }: { failures: StoreExtractionFailures[] }) {
  const totalFailures = failures.reduce((sum, f) => sum + f.failureCount, 0);
  const [dismissed, setDismissed] = useState(false);

  const hasElevated = failures.some((f) => f.failureRatePct >= 5 || f.failureCount >= 3);

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
    <div
      className={`rounded-2xl border p-4 sm:p-6 ${
        hasElevated ? "border-down/30 bg-down/5" : "border-hairline bg-surface-soft"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            hasElevated ? "bg-down/10 text-down" : "bg-surface-strong text-body"
          }`}
        >
          {hasElevated ? <AlertOctagon className="size-4" /> : <Info className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {hasElevated
                ? `${totalFailures} extraction failure${totalFailures === 1 ? "" : "s"} this week`
                : `${totalFailures} isolated failed upload${totalFailures === 1 ? "" : "s"} this week`}
            </h2>
            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss until next failure"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                hasElevated
                  ? "text-muted hover:bg-down/10 hover:text-down"
                  : "text-muted hover:bg-surface-strong hover:text-ink"
              }`}
              aria-label="Dismiss extraction failures panel"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted">
            {hasElevated
              ? "Gemini still bills for a failed call — a spike here can mean a bad prompt or an API issue, not just bad screenshots."
              : "Stores were charged 0 credits for failed attempts. A low failure rate (<5%) reflects standard user screenshot quality noise."}
          </p>

          <div className="mt-3 space-y-2">
            {failures.slice(0, 5).map((f) => {
              const isHigh = f.failureRatePct >= 15;
              const isElevated = f.failureRatePct >= 5 && f.failureRatePct < 15;
              return (
                <div
                  key={f.storeId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm hover:border-down/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Link
                      href={`/admin/stores/${f.storeId}`}
                      className="truncate font-medium text-ink hover:text-primary"
                    >
                      {f.storeName}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isHigh
                          ? "bg-rose-500/15 text-rose-700"
                          : isElevated
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {isHigh ? "High" : isElevated ? "Elevated" : "Low"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-muted">
                      {f.failureCount} fail{f.failureCount === 1 ? "" : "s"}{" "}
                      {f.failureRatePct > 0 && (
                        <span className="text-down font-medium">({f.failureRatePct.toFixed(1)}%)</span>
                      )}{" "}
                      · {formatExtractionCost(f.wastedCostUsd)}
                    </span>
                    <Link
                      href={`/admin/search?q=${encodeURIComponent(f.storeName)}`}
                      className="text-xs text-muted hover:text-ink underline"
                    >
                      Search
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
