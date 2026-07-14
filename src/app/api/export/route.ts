import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import { transactionsToCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) {
    return NextResponse.json({ error: "No store found" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const rows = await listTransactions(supabase, storeId, { from, to });
  const csv = transactionsToCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pesotrace-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
