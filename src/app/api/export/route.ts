import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId, listTransactions } from "@/lib/queries/transactions";
import { transactionsToCsv } from "@/lib/csv";
import { transactionsToPdf } from "@/lib/pdf";

import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  const storeId = await getCurrentStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No store found" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (from && to && from > to) {
    return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
  }
  if ((from && Number.isNaN(Date.parse(from))) || (to && Number.isNaN(Date.parse(to)))) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // Same reasoning as reports/page.tsx: an export can span any date range the
  // user picks, so the default 500-row cap would silently drop older rows.
  const { rows } = await listTransactions(supabase, storeId, { from, to }, 5000);
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const { data: store } = await supabase.from("stores").select("name").eq("id", storeId).single();
    const pdfBuffer = await transactionsToPdf(rows, {
      storeName: store?.name ?? "PesoTrace",
      from: from ?? "all time",
      to: to ?? dateStamp,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="pesotrace-export-${dateStamp}.pdf"`,
      },
    });
  }

  const csv = transactionsToCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="pesotrace-export-${dateStamp}.csv"`,
    },
  });
}
