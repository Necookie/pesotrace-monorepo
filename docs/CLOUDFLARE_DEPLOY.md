# Deploying to Cloudflare Workers

**Status: blocked on an unresolved conflict — do not attempt to deploy yet.** Read this section
before touching any of the setup below.

PesoTrace deploys to Cloudflare Workers via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)
(`@opennextjs/cloudflare`), which adapts a normal Next.js build into a Workers-compatible
bundle. Getting there hit a hard, three-way conflict between the framework version, the auth
provider, and the adapter:

- **Next.js 16 always runs `proxy.ts` (formerly "Middleware") on the Node.js runtime.** The
  framework docs are explicit: the `runtime` config option is not available in Proxy files, and
  setting it throws. There is no way to opt a Next 16 proxy file into the Edge runtime.
- **OpenNext's Cloudflare adapter refuses to build if it detects Node.js-runtime middleware**
  (`process.exit(1)` with "Node.js middleware is not currently supported").
- **Clerk's `auth()` / `currentUser()` hard-require `clerkMiddleware()` to have run** — this was
  learned the hard way: `src/proxy.ts` was deleted on the (wrong) assumption that it was just a
  redundant defense-in-depth layer on top of the per-route/per-action auth checks already in the
  app. It isn't — Clerk's SDK uses the middleware to populate the auth context in the first
  place, and every `currentUser()`/`auth()` call throws without it
  (`Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()`). The file has
  been restored; the app works locally again.

Net result: as currently structured (Next 16 + Clerk + `@opennextjs/cloudflare`), there is no
configuration that satisfies all three at once. One of the three has to change. See "Choosing a
way forward" below — this needs a decision, not another unilateral workaround.

## Choosing a way forward

Options, roughly in order of how much they disturb the rest of the app:

1. **Downgrade Next.js to 15.5.x.** Middleware could still run on the Edge runtime there (Node
   runtime for middleware was added as an *option* in 15.2–15.5, only made exclusive in 16.0).
   Keeps Clerk's middleware-based auth exactly as-is and unblocks the Cloudflare adapter. Cost:
   a real framework downgrade on what's currently a deliberately bleeding-edge stack — some App
   Router APIs this codebase already uses may differ or need adjustment going back a major
   version.
2. **Deploy to Cloudflare via Containers instead of Workers.** Cloudflare's Containers product
   runs an actual Docker image with a full Node.js runtime (not the V8-isolate Workers
   sandbox), so Next 16's Node-runtime proxy and Clerk's middleware work completely unmodified —
   this is much closer to "run `next start` in a container." Still Cloudflare, just a different
   product than Workers; check current pricing/limits against what you need.
3. **Replace Clerk's middleware-based auth with manual verification per request** (e.g.
   `@clerk/backend`'s `authenticateRequest()` called directly in `(app)/layout.tsx`, every API
   route, and every server action, instead of relying on `clerkMiddleware()`). Keeps Next 16 and
   Workers. Cost: touches every auth checkpoint in the app (the highest-risk code to get subtly
   wrong), and it's a pattern Clerk's own docs don't primarily design around for App Router — expect
   rough edges.
4. **Deploy somewhere other than Cloudflare Workers** (Vercel, or any normal Node host) where
   Node-runtime middleware just works, no adapter involved. Everything already set up for
   Cloudflare (`wrangler.jsonc`, the GitHub Actions workflow) would go unused.

Nothing past this point in the doc has been executed — the R2 bucket, secrets, and GitHub
Actions workflow are scaffolded but the app cannot actually build for Cloudflare until one of
the above is chosen and applied.

### PDF export (`pdfkit`) — unverified, watch this first

`pdfkit` reads its built-in font `.afm` files off disk at runtime (see the comment in
`next.config.ts` — `serverExternalPackages: ["pdfkit"]` was already there before this Cloudflare
work, added to make it work on Vercel/Node). Cloudflare Workers has no traditional filesystem;
`nodejs_compat` provides a polyfilled `fs` that can read files OpenNext explicitly bundles as
part of its file-tracing step — which, in principle, is exactly the mechanism that should let
`pdfkit` keep working. **This was not confirmed end-to-end** — the local build environment used
to set this up (Windows) can't complete that file-tracing step at all (see below), so the actual
Cloudflare Workers runtime was never exercised against a live "Export → PDF" click.

**Before relying on this in production: deploy once, then manually test PDF export
(`/ledger` → Export → PDF) against the deployed Worker.** If it throws, the fastest fix is
serving `/api/export?format=pdf` from a normal Node runtime instead (see "Splitting PDF export
onto Vercel" below) rather than debugging pdfkit-on-Workers under deadline pressure.

## One-time Cloudflare setup

1. **Create a Cloudflare account** (if you don't have one) and get your Account ID from the
   dashboard sidebar.
2. **Create an API token**: Cloudflare dashboard → My Profile → API Tokens → "Create Token" →
   use the "Edit Cloudflare Workers" template (needs Workers Scripts: Edit, and Workers R2
   Storage: Edit for the cache bucket below).
3. **Create the R2 bucket used for Next's incremental cache**:
   ```bash
   npx wrangler login   # one-time interactive auth for your local machine
   npx wrangler r2 bucket create pesotrace-opennext-cache
   ```
   (The bucket name must match `r2_buckets[0].bucket_name` in `wrangler.jsonc` if you rename it.)
4. **Set runtime secrets on the Worker** (these are read via `process.env` at request time —
   distinct from the `NEXT_PUBLIC_*` build-time vars below):
   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put GEMINI_API_KEY
   npx wrangler secret put CLERK_SECRET_KEY
   ```
   Each prompts for the value interactively — paste in the same value from `.env.local`.

## GitHub Actions setup (`.github/workflows/deploy-cloudflare.yml`)

The workflow is `workflow_dispatch`-only (manual "Run workflow" button) on purpose — it's new,
unverified infra. Switch it to trigger `on: push: branches: [main]` once you trust it.

Add these under repo Settings → Secrets and variables → Actions:

**Secrets:**
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — from the one-time setup above
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CLERK_SECRET_KEY` — needed at build time too,
  since some route modules read `process.env` at module scope during Next's page-data
  collection step, even though the actual request-time value comes from the `wrangler secret
  put` values above

**Variables** (non-secret):
- `NEXT_PUBLIC_POSTHOG_HOST` (e.g. `https://us.posthog.com`)

## Local build/preview

```bash
npm run cf:build      # next build, then adapt it for Cloudflare into .open-next/
npm run cf:preview    # build, then run it locally against workerd (the real Workers runtime)
npm run cf:deploy     # build, then deploy — same as CI, but from your machine
```

`npm run cf:preview` / `wrangler dev` reads secrets from a `.dev.vars` file (gitignored) rather
than `.env.local` — copy `.dev.vars.example` to `.dev.vars` and fill in the same values.

### Windows caveat

OpenNext's own build output warns it isn't fully compatible with Windows, and this was hit
directly while setting this up: `opennextjs-cloudflare build` fails with `EPERM: operation not
permitted, symlink ... pdfkit` while tracing dependency files, because creating a symlink on
Windows requires either an elevated (Administrator) shell or **Developer Mode** enabled
(Settings → Privacy & security → For developers → Developer Mode). Either fixes local builds.
Building via the GitHub Actions workflow above (Linux) sidesteps this entirely and is the
recommended path regardless — you generally don't want production deploys depending on one
person's laptop state anyway.

## Splitting PDF export onto Vercel (fallback, if pdfkit doesn't work on Workers)

If manual testing after the first deploy shows PDF export failing, the lowest-effort fix without
replacing `pdfkit`: keep the rest of the app on Cloudflare Workers, but deploy
`src/app/api/export/route.ts` (or a dedicated PDF-only route) separately to a normal Node runtime
(Vercel, or a small Node server) and have the "Download PDF" button in
`src/components/ledger/export-dialog.tsx` point at that URL instead of the local `/api/export`
route when `format=pdf`. CSV export has no such dependency and is confirmed to work anywhere.
