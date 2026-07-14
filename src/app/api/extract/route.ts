import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { extractTransactionFromImage } from "@/lib/gemini/extract-transaction";

export const maxDuration = 60;

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) {
    return NextResponse.json({ error: "No store found for this user" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG/JPG images are supported" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const extension = file.type === "image/png" ? "png" : "jpg";
  const objectPath = `${storeId}/${randomUUID()}.${extension}`;

  const [extractionResult, uploadResult] = await Promise.all([
    extractTransactionFromImage(buffer, file.type),
    supabase.storage.from("transaction-sources").upload(objectPath, buffer, {
      contentType: file.type,
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
      { error: extractionResult.error, source_file_url: objectPath },
      { status: 422 }
    );
  }

  return NextResponse.json({
    extracted: extractionResult.data,
    source_file_url: objectPath,
  });
}
