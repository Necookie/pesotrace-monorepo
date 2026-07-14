import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import { ReportBuilder } from "./report-builder";

export default async function ReportsPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  const rows = storeId ? await listTransactions(supabase, storeId) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-medium text-ink">Reports / Export</h1>
      <ReportBuilder rows={rows} />
    </div>
  );
}
