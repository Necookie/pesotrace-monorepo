import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

function bootstrapAdminIds(): string[] {
  return (process.env.PLATFORM_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Checks the env-var bootstrap list first (no DB round trip for the common
 * case), then falls back to the DB-backed platform_admins table. The env
 * var stays permanently as a break-glass path — losing DB access or
 * fat-fingering the last admin row can never lock the operator out.
 */
export async function isPlatformAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  if (bootstrapAdminIds().includes(userId)) return true;

  const supabase = createAdminClient();
  const { data } = await supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return data !== null;
}

/** Gates a page/layout to platform operators only. Redirects everyone else to the app. */
export async function requirePlatformAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !(await isPlatformAdmin(userId))) {
    redirect("/dashboard");
  }
  return userId;
}
