import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";
import type { Database } from "@/lib/database.types";

/**
 * profiles has no email column (Clerk owns identity), so reaching a store's
 * owner by email means resolving the owner's profile row, then asking
 * Clerk's Backend API for that user's email.
 */
export async function getStoreOwnerEmail(
  supabase: SupabaseClient<Database>,
  storeId: string
): Promise<string | null> {
  const { data: owner } = await supabase
    .from("profiles")
    .select("id")
    .eq("store_id", storeId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (!owner) return null;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(owner.id);
    return user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}
