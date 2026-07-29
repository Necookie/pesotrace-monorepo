import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import type { TransactionCategory } from "@/lib/database.types";
import { LedgerTable } from "@/components/ledger/ledger-table";
import { LedgerFilters } from "@/components/ledger/ledger-filters";
import { ExportDialog } from "@/components/ledger/export-dialog";
import { Pagination } from "@/components/ui/pagination";
import { TransactionDetailSheet } from "./transaction-detail-sheet";

const PAGE_SIZE = 50;

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();

  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { rows, total } = storeId
    ? await listTransactions(
        supabase,
        storeId,
        {
          direction: params.direction as "send" | "receive" | undefined,
          category: params.category as TransactionCategory | undefined,
          status: params.status as "needs_review" | "confirmed" | undefined,
          search: params.search,
        },
        PAGE_SIZE,
        offset
      )
    : { rows: [], total: 0 };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Preserve the active filters when jumping between pages; only `page` changes.
  const makeHref = (nextPage: number) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => entry[0] !== "page" && entry[1] !== undefined
      )
    );
    if (nextPage > 1) query.set("page", String(nextPage));
    const qs = query.toString();
    return qs ? `/ledger?${qs}` : "/ledger";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium text-ink">Ledger</h1>
        <ExportDialog />
      </div>
      <LedgerFilters />
      <LedgerTable rows={rows} />
      <Pagination currentPage={page} totalPages={totalPages} makeHref={makeHref} />
      <TransactionDetailSheet />
    </div>
  );
}
