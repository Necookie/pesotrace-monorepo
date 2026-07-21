import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/email/send";
import { getStoreOwnerEmail } from "@/lib/email/recipients";
import { TrialApprovedEmail } from "@/components/email/templates/trial-approved";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Best-effort — never throws, so a notification failure can't fail the
 * admin action (already committed) that triggered it.
 */
export async function notifyTrialApproved(
  supabase: SupabaseClient<Database>,
  storeId: string,
  grantAmount: number
): Promise<void> {
  try {
    const [{ data: store }, ownerEmail] = await Promise.all([
      supabase.from("stores").select("name").eq("id", storeId).maybeSingle(),
      getStoreOwnerEmail(supabase, storeId),
    ]);
    if (!ownerEmail) return;

    const storeName = store?.name ?? "your store";
    await sendEmail({
      to: ownerEmail,
      subject: `${grantAmount.toLocaleString()} credits added to ${storeName}`,
      react: <TrialApprovedEmail storeName={storeName} grantedCredits={grantAmount} appUrl={APP_URL} />,
    });
  } catch {
    // sendEmail already reports its own failures; swallow here too.
  }
}
