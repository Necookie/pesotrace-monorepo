import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { extractStatementFromPdf } from "@/lib/gemini/extract-statement";
import { reconcileStatement } from "@/lib/reconciliation";

import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) {
    return NextResponse.json({ error: "No store found for this user" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF statements are supported" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 15MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectPath = `${storeId}/${randomUUID()}.pdf`;

  const [extractionResult, uploadResult] = await Promise.all([
    extractStatementFromPdf(buffer),
    supabase.storage.from("transaction-sources").upload(objectPath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    }),
  ]);

  if (uploadResult.error) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadResult.error.message}` },
      { status: 500 }
    );
  }

  if (!extractionResult.ok) {
    return NextResponse.json(
      { error: extractionResult.error, cost: extractionResult.cost },
      { status: 422 }
    );
  }

  const reconciliation = reconcileStatement(extractionResult.rows);

  return NextResponse.json({
    rows: extractionResult.rows,
    reconciliation,
    source_file_url: objectPath,
    cost: extractionResult.cost,
  });
}
