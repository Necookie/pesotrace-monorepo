import { CATEGORY_LABELS, type TransactionCategory } from "@/lib/schemas/transaction";

const CATEGORY_STYLES: Record<TransactionCategory, string> = {
  cash_in: "text-up",
  cash_out: "text-down",
  load: "text-primary",
  bills: "text-ink",
  other: "text-muted",
};

export function CategoryBadge({ category }: { category: TransactionCategory }) {
  return (
    <span
      className={`inline-block rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium ${CATEGORY_STYLES[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
