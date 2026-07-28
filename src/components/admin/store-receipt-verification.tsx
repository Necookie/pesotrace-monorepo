import Link from "next/link";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { formatDateTime } from "@/lib/format";
import type { StoreReceiptRow } from "@/lib/queries/admin";

const SOURCE_LABEL: Record<string, string> = {
  screenshot: "Screenshot",
  statement: "Statement import",
  manual: "Manual entry",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="truncate text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Support-side verification view: each transaction's extracted fields next to
 * the receipt image it came from, so an operator can confirm the parse — the
 * amount, the direction, and especially the time — matches the original.
 */
export function StoreReceiptVerification({
  rows,
  hasMore,
  moreHref,
}: {
  rows: StoreReceiptRow[];
  hasMore: boolean;
  moreHref: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Transaction verification</h2>
      <p className="mt-1 text-xs text-muted">
        Each transaction beside the receipt it was extracted from. Click a receipt to open it
        full-size. Times shown are the store&apos;s local (Philippine) time.
      </p>

      {rows.length === 0 && (
        <p className="mt-4 text-sm text-muted">This store has no transactions yet.</p>
      )}

      <div className="mt-4 space-y-4">
        {rows.map(({ transaction, receiptUrl }) => (
          <div
            key={transaction.id}
            className="grid gap-4 rounded-xl border border-hairline p-3 sm:grid-cols-[minmax(0,180px)_1fr]"
          >
            <div>
              {receiptUrl ? (
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptUrl}
                    alt={`Receipt for ${transaction.ref_number}`}
                    className="max-h-72 w-full rounded-lg border border-hairline object-contain"
                  />
                </a>
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-hairline text-center text-xs text-muted">
                  {SOURCE_LABEL[transaction.source_type] ?? transaction.source_type}
                  <br />— no image
                </div>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Field label="Date & time">{formatDateTime(transaction.occurred_at)}</Field>
              <Field label="Amount">
                <Amount value={Number(transaction.amount)} direction={transaction.direction} />
              </Field>
              <Field label="Direction">{transaction.direction}</Field>
              <Field label="Category">
                <CategoryBadge category={transaction.category} />
              </Field>
              <Field label="Reference">
                <span className="font-mono">{transaction.ref_number}</span>
              </Field>
              <Field label="Counterparty">
                {transaction.counterparty_name || transaction.counterparty_number || "—"}
              </Field>
              <Field label="Service fee">
                <span className="font-mono">₱{transaction.fee_computed}</span>
              </Field>
              <Field label="Status">
                <StatusBadge status={transaction.status} />
              </Field>
              {transaction.confidence !== null && (
                <Field label="Extraction confidence">
                  <span className="font-mono">{Math.round(transaction.confidence * 100)}%</span>
                </Field>
              )}
              <Field label="Source">
                {SOURCE_LABEL[transaction.source_type] ?? transaction.source_type}
              </Field>
            </dl>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Link
            href={moreHref}
            className="rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-body hover:bg-surface-strong hover:text-ink"
          >
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
