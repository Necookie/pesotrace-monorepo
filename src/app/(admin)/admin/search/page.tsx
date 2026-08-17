import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchTransactionsAcrossStores } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { formatDateTime } from "@/lib/format";
import { TransactionSearchBox } from "@/components/admin/transaction-search-box";
import { AdminSearchCsvExport } from "@/components/admin/admin-search-csv-export";
import { HighlightedText } from "@/components/admin/highlighted-text";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";

export default async function AdminTransactionSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = createAdminClient();
  const results = query ? await searchTransactionsAcrossStores(supabase, query) : [];
  const uniqueStoreCount = new Set(results.map((r) => r.storeId)).size;

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Transaction search</h1>
      <p className="mt-1 text-sm text-body">
        Find a transaction by reference number or customer, across every store — for when a dispute comes in
        and you don&apos;t yet know which store it belongs to.
      </p>

      <div className="mt-6">
        <TransactionSearchBox />
      </div>

      <div className="mt-6">
        {!query && (
          <AdminEmptyState
            icon={SearchIcon}
            title="Cross-Store Transaction Search"
            description="Start typing a GCash reference number, customer name, or phone number to search across all merchant stores."
          />
        )}

        {query && results.length === 0 && (
          <AdminEmptyState
            icon={SearchIcon}
            title="No matching transactions"
            description={`No transactions matched "${query}". Check for typos or try searching with only the numeric portion of the reference number.`}
          />
        )}

        {query && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-soft px-4 py-2.5">
              <p className="text-sm text-body">
                Found <span className="font-semibold text-ink">{results.length}</span> matching transaction
                {results.length === 1 ? "" : "s"} across{" "}
                <span className="font-semibold text-ink">{uniqueStoreCount}</span> store
                {uniqueStoreCount === 1 ? "" : "s"}.
              </p>
              <AdminSearchCsvExport results={results} query={query} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-hairline">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 pl-4">Store</TableHead>
                    <TableHead className="py-3">Counterparty</TableHead>
                    <TableHead className="py-3">Reference</TableHead>
                    <TableHead className="py-3">Category</TableHead>
                    <TableHead className="py-3">Status</TableHead>
                    <TableHead className="py-3 text-right">Amount</TableHead>
                    <TableHead className="py-3 pr-4 text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(({ transaction, storeId, storeName }) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="py-3 pl-4">
                        <Link href={`/admin/stores/${storeId}`} className="text-ink hover:text-primary">
                          <HighlightedText text={storeName} query={query} />
                        </Link>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-body">
                        {transaction.counterparty_name ? (
                          <HighlightedText text={transaction.counterparty_name} query={query} />
                        ) : transaction.counterparty_number ? (
                          <HighlightedText text={transaction.counterparty_number} query={query} />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-mono text-xs text-muted">
                        <HighlightedText text={transaction.ref_number} query={query} />
                      </TableCell>
                      <TableCell className="py-3">
                        <CategoryBadge category={transaction.category} />
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Amount value={Number(transaction.amount)} direction={transaction.direction} />
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right text-sm text-muted">
                        {formatDateTime(transaction.occurred_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
