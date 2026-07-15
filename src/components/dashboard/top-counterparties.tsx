import { Amount } from "@/components/shared/amount";

export function TopCounterparties({
  items,
}: {
  items: { name: string; amount: number }[];
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-ink">Top Counterparties</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.name} className="flex items-center justify-between text-sm min-w-0 gap-3">
              <span className="text-body truncate flex-1" title={item.name}>{item.name}</span>
              <Amount value={item.amount} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
