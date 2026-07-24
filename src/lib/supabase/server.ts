import { cache } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Request-scoped. The client itself is stateless (service role, no session
// persistence), so returning one instance per request is safe — and it gives
// getCurrentStoreId's cache() a stable key, which is what actually lets the
// profiles lookup dedupe between a layout, its page, and any actions.
export const createClient = cache(async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
});
