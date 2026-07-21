import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listStoresWithCredits } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();
  const stores = await listStoresWithCredits(supabase);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Stores</h1>
      <p className="mt-1 text-sm text-body">Credit balances and usage across every store.</p>

      <div className="mt-6 rounded-2xl border border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Credit balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.storeId}>
                <TableCell>
                  <Link href={`/admin/stores/${store.storeId}`} className="font-medium text-ink hover:text-primary">
                    {store.storeName}
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    store.balance <= 0 ? "text-down" : "text-ink"
                  )}
                >
                  {store.balance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted">
                  No stores yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
