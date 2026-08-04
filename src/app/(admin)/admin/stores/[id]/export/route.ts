import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { listTransactions } from "@/lib/queries/transactions";
import { transactionsToCsv } from "@/lib/csv";

// Comfortably above any real store's lifetime transaction count — this is a
// full backup, not a paginated view.
const EXPORT_LIMIT = 50000;

/**
 * On-demand CSV backup of a store's transaction history, independent of
 * (and available well before) the delete flow — the danger zone card
 * already snapshots counts to the audit log before a cascade delete, but
 * not the actual data. This gives an operator a copy of what would be
 * destroyed, any time they want one, not just at the moment of deletion.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("name").eq("id", id).maybeSingle();
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const { rows } = await listTransactions(supabase, id, {}, EXPORT_LIMIT);
  const csv = transactionsToCsv(rows);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const safeName = store.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${safeName}-transactions-${dateStamp}.csv"`,
    },
  });
}
