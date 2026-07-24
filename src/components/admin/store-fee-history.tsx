import { formatDateTime } from "@/lib/format";
import type { FeeConfigChange } from "@/lib/queries/admin";

function describeSide(formula: string | null, tiers: unknown): string {
  if (formula) return formula.replace(/\s+/g, " ").trim();
  if (Array.isArray(tiers)) return `${tiers.length} tier${tiers.length === 1 ? "" : "s"}`;
  return "—";
}

/**
 * Admin-side fee edits for this store, newest first.
 *
 * Answers "my fees changed and I don't know why", which the stores row alone
 * cannot — it only holds the current value.
 */
export function StoreFeeHistory({ changes }: { changes: FeeConfigChange[] }) {
  if (changes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Fee change history</h2>
      <p className="mt-1 text-xs text-muted">
        Admin-side edits only — changes the owner makes in their own settings aren&apos;t recorded
        here.
      </p>

      <ul className="mt-4 space-y-3">
        {changes.map((change) => (
          <li key={change.id} className="rounded-xl border border-hairline p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">{formatDateTime(change.createdAt)}</span>
              <span className="font-mono text-[11px] text-muted" title={change.actorUserId}>
                {change.actorUserId}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <p className="truncate text-muted" title={describeSide(change.previousFormula, change.previousTiers)}>
                <span className="text-body">From:</span>{" "}
                <span className="font-mono">
                  {describeSide(change.previousFormula, change.previousTiers)}
                </span>
              </p>
              <p className="truncate text-ink" title={describeSide(change.newFormula, change.newTiers)}>
                <span className="text-body">To:</span>{" "}
                <span className="font-mono">
                  {describeSide(change.newFormula, change.newTiers)}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
