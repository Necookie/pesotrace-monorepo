import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import { formatPeso } from "@/lib/format";

export default async function BranchesPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  const { data: store } = storeId
    ? await supabase.from("stores").select("name").eq("id", storeId).single()
    : { data: null };

  const rows = storeId ? await listTransactions(supabase, storeId) : [];
  const totalVolume = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalFees = rows.reduce((sum, r) => sum + Number(r.fee_computed), 0);

  return (
    <div className="rounded-2xl border border-hairline p-6">
      <h2 className="text-sm font-semibold text-ink">Branches</h2>
      <p className="mt-1 text-xs text-muted">
        Multi-branch comparison — add more branches by inviting staff to additional stores
        (coming soon).
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="px-4 py-2 font-medium">Branch</th>
              <th className="px-4 py-2 font-medium">Volume</th>
              <th className="px-4 py-2 font-medium">Txns</th>
              <th className="px-4 py-2 font-medium">Fees</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-ink">{store?.name ?? "My Store"}</td>
              <td className="px-4 py-3 font-mono text-ink">{formatPeso(totalVolume)}</td>
              <td className="px-4 py-3 font-mono text-ink">{rows.length}</td>
              <td className="px-4 py-3 font-mono text-ink">{formatPeso(totalFees)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
