# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version warning

This project runs **Next.js 16** with **React 19**, both newer than most training data. APIs,
conventions, and file structure may differ from what you expect. Before writing App Router
code you're unsure about (route handlers, caching, `params`/`searchParams` shape, etc.), check
`node_modules/next/dist/docs/01-app/` rather than assuming Next.js 13/14 conventions.

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build — run this before every commit to verify nothing broke
npm run start    # run the production build
npm run lint     # eslint
npm test         # vitest run — unit tests for pure logic (lib/, schemas/)
```

Vitest is configured (`npm test` = `vitest run`). Coverage is currently limited to pure
business logic — fee computation, CSV escaping, statement reconciliation, extraction cost
math, and Zod schemas (see `src/lib/**/*.test.ts`). Server actions, route handlers, and the
dashboard aggregation query (`src/lib/queries/dashboard.ts`) have no tests yet — add them
alongside new logic there rather than assuming the pattern doesn't apply.

**Deployment target is Vercel** (`VERCEL_TOKEN` in `.env.example`). Cloudflare Workers was
evaluated and ruled out: Next 16 always runs `proxy.ts` on the Node.js runtime with no opt-out,
Cloudflare's `@opennextjs/cloudflare` adapter refuses to build with Node-runtime middleware, and
Clerk's `auth()`/`currentUser()` hard-require `clerkMiddleware()` to be registered in that file
— so there's no way to satisfy all three at once without downgrading Next, switching to
Cloudflare Containers, or rewriting auth to not need middleware. None of those were worth it;
`proxy.ts` stays as the normal Clerk middleware file and the app deploys as a standard Next.js
Node server.

## Project

PesoTrace — a SaaS dashboard for GCash remittance store owners/staff. Upload GCash transaction
screenshots (single or bulk) or full statement exports, auto-extract structured transaction
data via Gemini, track fees, and view analytics. See `docs/PROJECT_BRIEF.md` for full product
scope, wireframe screen contents, database shape, and the milestone-ordered build plan — treat
it as the source of truth for what to build next and in what order.

## Architecture

**Stack**: Next.js App Router + TypeScript, Tailwind CSS v4, shadcn/ui (base-ui primitives, not
Radix — see `components.json`, `style: "base-nova"`), Supabase (Postgres + Auth + Storage),
Gemini (`@google/genai`) for image/document extraction, TanStack Query, React Hook Form + Zod,
PostHog.

**Design tokens live in `src/app/globals.css`, not a `tailwind.config.js`** — Tailwind v4 is
CSS-first. The `@theme` block defines PesoTrace's own tokens (`--color-primary`, `--color-up`/
`--color-down`, `--color-canvas`, `--font-mono`, `--radius-pill`, etc.); a second `@theme
inline` block + `:root` maps shadcn's component-level tokens (`--primary`, `--secondary`,
`--border`...) onto those same PesoTrace values, so shadcn components stay on-brand without
per-component overrides. **The app is light-theme-only by design** — there is no `.dark` block
and no theme toggle; don't add dark mode. (The dark hero pattern in the original design
inspiration is reserved for a future marketing landing page only, out of scope for the app
shell.)

**Brand rules that matter when adding UI** (full spec in `docs/PROJECT_BRIEF.md`):
- `--color-primary` (#0052ff) is scarce — primary buttons, active nav, links only.
- Send/Receive amounts use `--color-down`/`--color-up` as **text color only, never
  backgrounds**.
- All buttons/badges are pill-shaped (`rounded-pill`, already baked into
  `components/ui/button.tsx`'s base class — don't reintroduce `rounded-lg` there). Cards use
  `rounded-2xl`/24px. No sharp corners.
- Every numeric value (amounts, balances, ref numbers, fee totals) renders in `font-mono`
  (JetBrains Mono), never the default sans font.

**shadcn/ui specifics**: this registry version uses `@base-ui/react` primitives (not Radix), and
`npx shadcn@latest add <component>` will silently no-op for components not in this registry
(e.g. `form` isn't available — use React Hook Form directly with the existing Input/Label
components instead of a shadcn `<Form>` wrapper). When re-running `shadcn add` for a component
that shares a dependency with `button.tsx`, the CLI will prompt to overwrite `button.tsx`
non-interactively (defaults to no in a non-tty shell) — if you do need `-o`/`--overwrite`,
re-apply the pill-radius edit in `button.tsx` afterward, it is not the shadcn default.

**Gemini extraction is a route handler, not a server action**: `src/app/api/extract/route.ts`
(planned) handles image/statement upload → Gemini call → structured JSON, kept separate from
the fast DB-mutation server actions (confirm/insert, status changes). Server actions in the App
Router queue per-client, which would serialize the bulk-upload flow if extraction ran through
one — see the "Key architectural decisions" section of `docs/PROJECT_BRIEF.md`... actually see
the fable-generated plan referenced there for the full reasoning.

**Shared Zod schema**: transaction fields (amount, direction, ref_number, counterparty,
occurred_at, confidence) are defined once in `src/lib/schemas/transaction.ts` and reused for
(1) validating Gemini's response, (2) the upload review form's `zodResolver`, and (3) the base
that the server-side insert schema extends. Never hand-duplicate this shape — derive types with
`z.infer`.

**Multi-tenancy**: every table is scoped by `store_id`; RLS policies (once migrations land)
resolve the current user's store via a `security definer` helper function rather than a direct
join, to avoid recursive policy lookups on the `profiles` table.

**Credentials**: real values live in `.env.local` (gitignored). `.env.example` documents the
required keys (Supabase URL/anon/service-role, Supabase access token + project ID, Gemini API
key, PostHog key/host, Vercel token) with no values — keep it in sync when adding new env vars,
but never put secrets in it.

## Git conventions for this repo

Commit in small, single-purpose units (`feat(scope): ...`, `fix: ...`, `chore: ...`) — this was
an explicit ask from the project owner for granular version control, not just a style
preference. Run `npm run build` before each commit.
