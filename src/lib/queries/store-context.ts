import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export type StoreContext = {
  storeId: string | null;
  storeName: string | null;
  creditBalance: number;
};

/**
 * The one profile lookup per request. The (app) layout needs the store name
 * and credit balance for the nav; pages and actions need the store id. Before
 * this, those were two separate round trips on every render — the layout's
 * embed query plus getCurrentStoreId's own `select("store_id")`.
 *
 * Takes no arguments so React's cache() key is stable across every caller in
 * the request, which is the whole point.
 */
export const getStoreContext = cache(async function getStoreContext(): Promise<StoreContext> {
  const { userId } = await auth();
  if (!userId) return { storeId: null, storeName: null, creditBalance: 0 };

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("store_id, stores(name, store_credits(balance))")
    .eq("id", userId)
    .maybeSingle();

  // store_credits.store_id is a 1:1 PK relationship. PostgREST returns this
  // embed as a single object (verified against the live API), but
  // supabase-js's generic inference — given this hand-written Database type's
  // Relationships metadata — types it as an array. Cast rather than index,
  // since indexing [0] would silently break this.
  const embeddedCredit = data?.stores?.store_credits as unknown as
    | { balance: number }
    | null
    | undefined;

  return {
    storeId: data?.store_id ?? null,
    storeName: data?.stores?.name ?? null,
    creditBalance: embeddedCredit?.balance ?? 0,
  };
});
