import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { extractStatementFromPdf } from "@/lib/gemini/extract-statement";
import { reconcileStatement } from "@/lib/reconciliation";
import { checkRateLimit } from "@/lib/rate-limit";
import { creditsForExtraction } from "@/lib/credits/pricing";
import { captureException } from "@/lib/monitoring-server";
import { notifyExtractionFailed } from "@/lib/email/notify-store";
import { uploadWithRetry } from "@/lib/storage/upload-with-retry";
import { readSupabaseWithRetry, SupabaseReadError } from "@/lib/supabase/read-with-retry";

import { auth } from "@clerk/nextjs/server";

export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (error) {
    await captureException(error, "server", { route: "api/extract-statement" });
    if (error instanceof SupabaseReadError && error.transient) {
      return NextResponse.json(
        {
          error: "Our data service is temporarily unavailable. Please retry this statement.",
          retryable: true,
        },
        { status: 503, headers: { "Retry-After": "2" } }
      );
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

async function handlePost(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();

  const storeId = await getCurrentStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No store found for this user" }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`extract-statement:${storeId}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many statement imports — please wait a bit before trying again" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  const [credits, store] = await Promise.all([
    readSupabaseWithRetry(
      (signal) =>
        supabase
          .from("store_credits")
          .select("balance")
          .eq("store_id", storeId)
          .abortSignal(signal)
          .maybeSingle(),
      "load store credits for statement extraction"
    ),
    readSupabaseWithRetry(
      (signal) =>
        supabase
          .from("stores")
          .select("suspended")
          .eq("id", storeId)
          .abortSignal(signal)
          .single(),
      "load store settings for statement extraction"
    ),
  ]);

  if (store?.suspended) {
    return NextResponse.json(
      { error: "This store's access is currently suspended. Contact support for help." },
      { status: 403 }
    );
  }
  if ((credits?.balance ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Out of AI credits — request more from your store settings." },
      { status: 402 }
    );
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
    uploadWithRetry(() =>
      supabase.storage.from("transaction-sources").upload(objectPath, buffer, {
        contentType: "application/pdf",
        // Retries reuse this random path. Upsert makes the operation
        // idempotent if Storage accepted the bytes but lost the response.
        upsert: true,
      })
    ),
  ]);

  if (!uploadResult.ok) {
    // A transport failure can happen after Storage accepted the object. Since
    // the response will use a null source URL, clean up that exact random path.
    await supabase.storage.from("transaction-sources").remove([objectPath]);
    await captureException(uploadResult.error, "server", {
      route: "api/extract-statement",
      operation: "storage-upload",
      attempts: uploadResult.attempts,
    });
  }

  if (!extractionResult.ok) {
    if (uploadResult.ok) {
      await supabase.storage.from("transaction-sources").remove([objectPath]);
    }
    // Google still bills for a failed call — log the real cost without
    // charging the store's credit balance for a result they can't use.
    await supabase.rpc("consume_credit", {
      p_store_id: storeId,
      p_credits: 0,
      p_cost_usd: extractionResult.cost.costUsd,
      p_source_type: "statement",
      p_input_tokens: extractionResult.cost.inputTokens,
      p_output_tokens: extractionResult.cost.outputTokens,
      p_created_by: userId,
    });
    await notifyExtractionFailed(supabase, storeId, extractionResult.error);
    return NextResponse.json(
      { error: extractionResult.error, cost: extractionResult.cost },
      { status: 422 }
    );
  }

  await supabase.rpc("consume_credit", {
    p_store_id: storeId,
    p_credits: creditsForExtraction(extractionResult.cost.costUsd),
    p_cost_usd: extractionResult.cost.costUsd,
    p_source_type: "statement",
    p_input_tokens: extractionResult.cost.inputTokens,
    p_output_tokens: extractionResult.cost.outputTokens,
    p_created_by: userId,
  });

  const reconciliation = reconcileStatement(extractionResult.rows);

  return NextResponse.json({
    rows: extractionResult.rows,
    reconciliation,
    source_file_url: uploadResult.ok ? objectPath : null,
    warning: uploadResult.ok
      ? undefined
      : "Statement extracted, but the source PDF could not be stored. You can still review and import it.",
    cost: extractionResult.cost,
  });
}
