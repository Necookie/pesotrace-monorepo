import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { describeTier, summarizeFeeConfig, type StoreFeeConfig } from "@/lib/fees";

/**
 * What the owner currently has saved, read-only.
 *
 * Sits above the editor so an operator taking a support call can read the
 * store's actual setup out loud before touching anything — the editor's
 * fields are live state and stop reflecting what is saved the moment
 * someone types.
 */
export function StoreFeeSummary({ config }: { config: StoreFeeConfig }) {
  const summary = summarizeFeeConfig(config);

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Current fee configuration</h2>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 text-xs font-medium",
            summary.formulaError
              ? "bg-down/10 text-down"
              : summary.mode === "formula"
                ? "bg-primary/10 text-primary"
                : "bg-surface-strong text-muted"
          )}
        >
          {summary.mode === "formula" ? "Custom formula" : summary.label}
          {summary.isDefault && " (default)"}
        </span>
      </div>

      {summary.formulaError && (
        <p className="mt-3 rounded-xl bg-down/5 px-3 py-2 text-xs text-down">
          This store&apos;s saved formula no longer works ({summary.formulaError}). Every
          transaction is silently being billed from the tier table below instead.
        </p>
      )}

      {summary.isDefault && !summary.formulaError && (
        <p className="mt-3 rounded-xl bg-surface-soft px-3 py-2 text-xs text-body">
          This store is still on the shipped default and has never set up its own fees.
        </p>
      )}

      {summary.mode === "formula" ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-soft p-3 font-mono text-xs text-ink">
          {config.formula}
        </pre>
      ) : (
        <ul className="mt-3 space-y-1">
          {config.tiers.map((tier, i) => (
            <li key={i} className="font-mono text-xs text-body">
              {describeTier(tier)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <p className="text-xs text-muted">What customers actually pay</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {summary.samples.map((sample) => (
            <span
              key={sample.amount}
              className="rounded-pill bg-surface-strong px-3 py-1.5 font-mono text-xs text-ink"
            >
              {formatPeso(sample.amount)} → {formatPeso(sample.fee)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
