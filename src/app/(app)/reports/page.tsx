import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import { ReportBuilder } from "./report-builder";

export default async function ReportsPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  // Reports lets the user pick any date range client-side after load, so the
  // default 500-row (most-recent-first) cap used elsewhere would silently
  // drop older transactions from a report that goes further back.
  const rows = storeId ? (await listTransactions(supabase, storeId, {}, 5000)).rows : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-medium text-ink">Reports / Export</h1>
      <ReportBuilder rows={rows} />
    </div>
  );
}
