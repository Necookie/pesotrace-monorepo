# PesoTrace Design System

Adapted from a Coinbase-style institutional-fintech reference into an in-app, light-theme-only
system for PesoTrace's dashboard product. The reference system's dark hero + floating
product-UI-mockup pattern is preserved as a *future marketing landing page* concept only — it
is intentionally not implemented in the app shell.

## Colors

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#0052ff` | Every primary CTA, active nav state, brand links. Used scarcely. |
| `--color-primary-active` | `#003ecc` | Press state on primary buttons. |
| `--color-primary-disabled` | `#a8b8cc` | Disabled primary buttons. |
| `--color-canvas` | `#ffffff` | Page floor. |
| `--color-surface-soft` | `#f7f7f7` | Subtle alternating band surface. |
| `--color-surface-strong` | `#eef0f3` | Secondary button fill, search pills, icon plates. |
| `--color-hairline` | `#dee1e6` | Default 1px divider. |
| `--color-hairline-soft` | `#eef0f3` | Lighter divider. |
| `--color-ink` | `#0a0b0d` | Headings, primary nav, strong emphasis. |
| `--color-body` | `#5b616e` | Default running text. |
| `--color-muted` | `#7c828a` | Sub-titles, secondary labels. |
| `--color-muted-soft` | `#a8acb3` | Disabled text. |
| `--color-on-primary` | `#ffffff` | Text on primary-colored surfaces. |
| `--color-up` | `#05b169` | Receive amounts. **Text only, never a background fill.** |
| `--color-down` | `#cf202f` | Send amounts. **Text only, never a background fill.** |

The app is **light-theme-only** — no `.dark` block, no theme toggle. All tokens live in
`src/app/globals.css` under an `@theme` block (Tailwind v4 CSS-first config, not
`tailwind.config.js`).

## Typography

- **Sans**: Inter (`--font-sans` / `--font-inter`) — all UI text, nav, labels, buttons.
- **Mono**: JetBrains Mono, weight 500 (`--font-mono` / `--font-jetbrains-mono`) — **every**
  numeric value: amounts, balances, reference numbers, fee totals. Never render a number in the
  default sans font.
- Headings cap at `text-3xl`/`font-medium` in the app shell — this is a data-dense dashboard,
  not an editorial marketing page, so the reference system's 80px display-mega scale is not
  used here.

## Shape

| Token | Value | Use |
|---|---|---|
| `rounded-pill` | 100px | All buttons, badges, pills. Baked into `components/ui/button.tsx`'s base class — never reintroduce a smaller radius there. |
| `rounded-2xl` | 24px | Cards, panels, product-UI-style containers. |
| `rounded-md`/`rounded-xl` (shadcn scale) | ~9–17px (derived from `--radius: 0.75rem`) | Inputs, compact controls. |
| `rounded-full` | — | Avatars, icon plates. |

No sharp corners anywhere in the product.

## Elevation

- Flat by default — most surfaces have no shadow or border.
- 1px hairline borders (`--color-hairline`) separate rows/panels (table rows, card outlines).
- A single soft shadow tier (`0 4px 12px rgba(0,0,0,0.04)`) appears on hover only — no
  additional shadow tiers.

## Spacing

4px base unit. App panels use 24–32px gaps between sections (tighter than the reference
system's 96px editorial section rhythm, appropriate for a dashboard rather than a marketing
page).

## Brand rules

1. `--color-primary` is scarce: primary buttons, active nav item, and inline brand links only —
   not decorative fills.
2. Send/Receive amounts use `--color-down`/`--color-up` as **text color only**. Never as a
   background/badge fill — badges for transaction status (`needs_review` / `confirmed`) use
   neutral surface colors with an icon or label, not red/green fills.
3. Every button and badge is pill-shaped. Every card is `rounded-2xl`. No exceptions.
4. Every numeric value renders in `font-mono`.
5. No dark mode in the app shell. If a marketing landing page is built later, the dark
   hero-band + floating product-UI-card pattern from the original reference system applies
   there — not to any authenticated app screen.

## Component reference (implemented)

- `components/ui/*` — shadcn/ui (base-ui primitives, not Radix — see `components.json`),
  reconciled to the tokens above during setup (button pill radius, brand primary color).
- `components/shared/amount.tsx` — the canonical way to render a peso amount: mono font,
  up/down text color by transaction direction, ₱ formatting.
