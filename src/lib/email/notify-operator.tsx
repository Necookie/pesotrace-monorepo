import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/email/send";
import { NewTrialRequestEmail } from "@/components/email/templates/new-trial-request";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Best-effort — never throws, so an email failure can't fail the request. */
export async function notifyNewTrialRequest(supabase: SupabaseClient<Database>, storeId: string): Promise<void> {
  const operatorEmail = process.env.OPERATOR_ALERT_EMAIL;
  if (!operatorEmail) return;

  try {
    const { data: store } = await supabase.from("stores").select("name").eq("id", storeId).maybeSingle();
    const storeName = store?.name ?? "A store";

    await sendEmail({
      to: operatorEmail,
      subject: `${storeName} requested AI credits`,
      react: <NewTrialRequestEmail storeName={storeName} adminUrl={`${APP_URL}/admin`} />,
    });
  } catch {
    // sendEmail already reports its own failures; swallow here too.
  }
}
