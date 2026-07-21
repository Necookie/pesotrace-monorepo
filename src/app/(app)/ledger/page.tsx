import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import type { TransactionCategory } from "@/lib/database.types";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { LedgerFilters } from "@/components/ledger/ledger-filters";
import { ExportDialog } from "@/components/ledger/export-dialog";
import { TransactionDetailSheet } from "./transaction-detail-sheet";

const PAGE_SIZE = 100;

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  const limit = Math.max(PAGE_SIZE, Number(params.limit) || PAGE_SIZE);

  const { rows, hasMore } = storeId
    ? await listTransactions(
        supabase,
        storeId,
        {
          direction: params.direction as "send" | "receive" | undefined,
          category: params.category as TransactionCategory | undefined,
          status: params.status as "needs_review" | "confirmed" | undefined,
          search: params.search,
        },
        limit
      )
    : { rows: [], hasMore: false };

  const loadMoreParams = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
  loadMoreParams.set("limit", String(limit + PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-ink">Ledger</h1>
        <ExportDialog />
      </div>
      <LedgerFilters />
      <LedgerTable rows={rows} />
      {hasMore && (
        <div className="flex justify-center">
          <Link
            href={`/ledger?${loadMoreParams.toString()}`}
            className="rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-body hover:bg-surface-strong hover:text-ink"
          >
            Load more
          </Link>
        </div>
      )}
      <TransactionDetailSheet />
    </div>
  );
}
