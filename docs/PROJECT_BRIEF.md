# PesoTrace — Project Brief

## Product
A SaaS dashboard for GCash remittance store owners/staff. Upload GCash transaction
screenshots (single or bulk) or full statement exports (PDF/CSV), auto-extract structured
transaction data via Gemini, track fees (₱20 per ₱1,000 remitted, configurable tiers), and
view analytics. Multi-branch support from day one (schema-level), single-tenant UX for MVP.

## Tech Stack
- Frontend: Next.js 14+ (App Router, TypeScript), Tailwind CSS, shadcn/ui, Tremor (charts),
  TanStack Query, React Hook Form + Zod
- Backend/Data: Supabase (Postgres + Auth + Storage), RLS for tenant isolation
- Extraction: Gemini 2.5 Flash-Lite (image + native PDF understanding), Zod-validated output
- Analytics: PostHog
- Hosting: Vercel

## Database shape (initial)
- `stores` (id, name, fee_tier_config jsonb, created_at)
- `profiles` (id -> auth.users, store_id, role: owner|manager|staff)
- `transactions` (id, store_id, direction: send|receive, amount, ref_number, counterparty_number,
  counterparty_name, occurred_at, status, fee_computed, source_type: screenshot|statement,
  source_file_url, confidence, created_by, created_at)
- RLS: all tables scoped by store_id matching the requesting user's profile.store_id

## Wireframe screens (already designed, 8 screens, GCash Transaction Monitor Wireframes.html)
1. **Login / Sign up** — centered card, email+password, Google OAuth, split-panel variant with
   value props ("Upload screenshots, get structured data", "Multi-branch reporting in one
   place", "Fee tier tracking built-in")
2. **Dashboard (home)** — top nav (Dashboard/Ledger/Upload/Reports/Settings), search bar, KPI
   tiles (Volume ₱482,150 / Transactions / Fees Earned ₱6,240 / Avg. Size ₱1,545), Send vs.
   Receive trend chart with Daily/Weekly/Monthly toggle, Top Counterparties list (name + amount),
   Volume by Time of Day heatmap, alert/review rail
3. **Upload flow** — tabs: Single Image / Bulk Images / Import Statement; drag-drop zone
   ("PNG, JPG up to 10MB", "Browse files"), post-extraction review card showing source
   screenshot beside editable fields (Amount, Direction, Reference No., Counterparty), Skip/
   Confirm actions
4. **Transaction Ledger** — grouped rows (Daily/Weekly/Monthly toggle) with net subtotals,
   filter bar (date range, direction, status, amount range, counterparty), global search,
   status badges (Confirmed / Needs review), bulk-select action bar (Export/Re-categorize/
   Delete), empty state ("No transactions match these filters" + Clear filters)
5. **Transaction Detail** — slide-over panel from right, tabs (Details/History/Notes), full
   fields + source image, tags/notes field, Confirm action for "Needs review" items
6. **Reports / Export** — two-column live-preview builder (Date range, Grouping, Format) +
   stepper wizard for scheduled reports (Range → Schedule steps)
7. **Settings** — left sub-nav (Fee tiers, Retention policy, Branding, Notifications), fee tier
   table (Range → Fee, e.g. "₱20 flat" / "₱20 / ₱1,000" across Tier 1/2/3), branch list
   (Poblacion/Divisoria branches), logo-on-reports toggle
8. **Multi-store switcher** — branch comparison table (Branch, Volume, Txns, Fees) across
   Poblacion/Divisoria/Cubao/Baclaran, branch search

## Design System (PesoTrace, adapted from a Coinbase-style design.md — full spec at
docs/DESIGN_SYSTEM.md)
- Light theme by default for the entire app (dark hero pattern reserved for future marketing
  landing page only, not used in-app)
- Single accent: Coinbase-Blue-equivalent `--color-primary: #0052ff`, used scarcely (primary
  buttons, active nav, links only)
- Semantic colors: `--color-up: #05b169` (Receive, text-only), `--color-down: #cf202f` (Send,
  text-only) — never as background fills
- Surfaces: `--color-canvas: #ffffff`, `--color-surface-soft: #f7f7f7`,
  `--color-surface-strong: #eef0f3`, `--color-hairline: #dee1e6`
- Text: `--color-ink: #0a0b0d`, `--color-body: #5b616e`, `--color-muted: #7c828a`
- Typography: Inter for all UI text/nav/labels (400/600/700 weights); JetBrains Mono for every
  numeric value (amounts, balances, ref numbers, fee totals) via a `font-mono` utility class
  used consistently on amount cells
- Radii: pill (100px) for all buttons/badges, 24px (`rounded-2xl`) for cards/panels, 12px
  (`rounded-md`... map to Tailwind `rounded-xl`) for inputs, full for avatars/icon plates — no
  sharp corners
- Elevation: flat by default, 1px hairline borders between rows/panels, single soft shadow
  tier on hover only
- Spacing: 4px base unit, app panels use 24–32px gaps between sections

## MVP scope for this build (in order)
1. Auth (Supabase email/password + Google OAuth) — Login/Sign up screen
2. Dashboard shell + KPI tiles + trend chart (can start with mock/seed data, wire to real
   queries once ledger exists)
3. Upload flow — single + bulk image upload → Gemini extraction → review/confirm →
   insert into `transactions`
4. Transaction Ledger — grouped table (daily/weekly/monthly), filters, search
5. Transaction Detail slide-over
6. Fee tier settings (basic — flat tier config, applied on insert)
7. Reports/export (CSV export minimum for MVP; PDF/scheduled reports can be fast-follow)
8. Multi-store switcher (schema supports it from day one; UI can be minimal for MVP — a single
   store is fine to ship first, switcher UI stubbed)

Bulk statement import (PDF parsing) and full Settings (retention/branding/notifications) are
fast-follows after the core loop (screenshot → structured record → ledger → dashboard) works
end-to-end.

## Credentials available (already in .env.local — do not ask user to repaste)
Supabase (URL, anon key, service role key), Gemini API key, PostHog project key, Vercel token.
GitHub repo: https://github.com/Necookie/pesotrace-monorepo (empty, remote already added
locally).

## What's being asked of you (the planning agent)
Produce a concrete, ordered implementation plan — milestones, file/folder structure, and the
sequence of commits — for a Sonnet-based coding agent to execute autonomously with frequent
small commits. Assume Next.js App Router conventions. Call out any architectural decisions
worth flagging (e.g. server actions vs. API routes for the extraction pipeline, how to
structure the Zod schema shared between client review UI and server insert). Keep the plan
tightly scoped to the MVP list above — don't re-litigate tech stack or design choices, those
are fixed.
