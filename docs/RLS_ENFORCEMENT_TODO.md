# Follow-up: make RLS actually enforce tenant isolation

**Status:** not applied. Requires a Supabase dashboard change first — do that, confirm it,
then apply the code change below in its own commit.

## The problem

`src/lib/supabase/server.ts` (the client used by every page, server action, and route handler
in the app) and `src/lib/supabase/admin.ts` are functionally identical — both connect with
`SUPABASE_SERVICE_ROLE_KEY`, which bypasses Postgres row-level security entirely.

Meanwhile, `supabase/migrations/0002_rls.sql` and `0005_clerk_auth.sql` define real RLS
policies scoped by `store_id`, and `0005` specifically rewrote `current_store_id()` /
`current_role()` to read the Clerk user id out of `request.jwt.claims->>'sub'` — i.e. someone
already did the work to make RLS work with Clerk-issued JWTs. That only takes effect if
requests are authenticated as the end user via Supabase's third-party-auth integration. Since
`server.ts` always uses the service-role key, that JWT path is never exercised. **Every tenant
isolation guarantee in this app currently lives entirely in hand-written `.eq("store_id",
storeId)` calls** — correct today, but with no second layer to catch a future query that
forgets one.

## Fix — two parts

### 1. Supabase dashboard: enable Clerk as a Third-Party Auth provider

In the Supabase dashboard: **Authentication → Third Party Auth**. Add Clerk, pointing it at
your Clerk instance's JWKS/issuer URL (from the Clerk dashboard → your app → **JWT templates**
or **API keys** page — Clerk's docs call this out as "Connect with Supabase," it walks through
generating the exact issuer domain Supabase needs). This tells Postgres to trust JWTs signed by
Clerk when they arrive with a Supabase request, without needing a shared secret.

**Do this in a Supabase staging/dev project first if you have one — flipping the code below
before this is confirmed working will make every query in the app return zero rows (RLS denies
by default), which reads as "the app is completely broken."**

### 2. Code: make `server.ts` forward the Clerk session JWT

```ts
// src/lib/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // anon key, not service-role
    {
      auth: { autoRefreshToken: false, persistSession: false },
      accessToken: async () => (await auth()).getToken() ?? null,
    }
  );
}
```

- Switches from `SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already in
  `.env.example`, already used by the browser client).
- `accessToken` is the option `@supabase/supabase-js` v2 uses for exactly this — a per-request
  callback returning the caller's JWT, which Postgres then evaluates against RLS policies as
  `auth.jwt()` / `request.jwt.claims`.
- Existing calls that pass this client (`getCurrentStoreId`, every server action, every page)
  keep their current `.eq("store_id", storeId)` filters — those aren't redundant, they stay as
  defense-in-depth and because RLS alone doesn't scope `.select()` column lists or business
  logic, only which *rows* are visible.

### 3. Keep `admin.ts` for genuine cross-tenant cases

`(app)/layout.tsx`'s onboarding flow (create a store + profile for a brand-new user, before any
`profiles` row — and therefore any `store_id` — exists for them) is the one place in the app
that legitimately needs to bypass RLS. Leave that on `createAdminClient()`. After the fix above,
`admin.ts` and `server.ts` should no longer be identical — if they still are, something's wrong.

## Verification before merging

1. Confirm the Third-Party Auth provider shows "Connected" in the Supabase dashboard.
2. Apply the `server.ts` change on a branch, run the app locally against a real Clerk session,
   and confirm: dashboard/ledger/settings all still load data for your own store.
3. Manually test cross-tenant isolation: with two separate store accounts, confirm store A's
   session can't read store B's transactions even with a crafted request (e.g. hit
   `/api/export` while impersonating store A but you know store B's `store_id` isn't
   discoverable/usable).
4. Watch Supabase logs for `permission denied for table transactions`-type errors after
   deploying — that's what a missed edge case looks like (e.g. a query path that isn't scoped
   correctly, or a JWT claim mismatch).
