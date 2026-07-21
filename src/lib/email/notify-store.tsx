import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/email/send";
import { getStoreOwnerEmail } from "@/lib/email/recipients";
import { ExtractionFailedEmail } from "@/components/email/templates/extraction-failed";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Best-effort — never throws, so an email failure can't fail the request. */
export async function notifyExtractionFailed(
  supabase: SupabaseClient<Database>,
  storeId: string,
  reason: string
): Promise<void> {
  try {
    const [{ data: store }, ownerEmail] = await Promise.all([
      supabase.from("stores").select("name, notification_prefs").eq("id", storeId).maybeSingle(),
      getStoreOwnerEmail(supabase, storeId),
    ]);
    if (!ownerEmail) return;
    if (store?.notification_prefs && !store.notification_prefs.extractionFailed) return;

    const storeName = store?.name ?? "your store";
    await sendEmail({
      to: ownerEmail,
      subject: "An upload couldn't be processed",
      react: <ExtractionFailedEmail storeName={storeName} reason={reason} appUrl={APP_URL} />,
    });
  } catch {
    // sendEmail already reports its own failures; swallow here too.
  }
}
