# Admin Page Update Recommendations & Strategic Roadmap

This document outlines 15+ high-priority update recommendations and architectural improvements specifically designed for the **Admin** portal (`/admin`). These recommendations elevate operational observability, merchant store governance, cost protection, risk mitigation, and support workflows.

---

## 1. Store Health & Operational Risk Scoring
- **Context**: Admins currently see credit balance and raw extraction failure counts separately.
- **Recommendation**: Implement an automated **Store Health Score** (Healthy, Warning, Critical, Inactive) that combines credit adequacy, 7-day extraction failure rate, and recent activity recency.
- **Impact**: Provides instant visibility into struggling stores or potential customer churn before tickets are filed.

---

## 2. Multi-Dimensional Store Table Quick Filters
- **Context**: The store overview table only supported text search and suspended filter.
- **Recommendation**: Add balance status quick filter pills:
  - `All Stores`
  - `Out of Credits (<= 0)`
  - `Low Credits (1-10)`
  - `Active Stores`
  - `Suspended`
- **Impact**: Enables 1-click triage of stores requiring credit top-ups or intervention.

---

## 3. Inline Row Actions & Quick Nav Dropdown
- **Context**: Navigating to store transactions or adjusting credits required clicking through multiple pages.
- **Recommendation**: Provide an interactive row action menu in `StoresOverviewTable` to view store details, jump directly to cross-store transaction search filtered by that store, or open the quick credit adjustment modal.
- **Impact**: Reduces admin click-depth by 60% for routine support inquiries.

---

## 4. Cross-Store Transaction Search Match Highlighting
- **Context**: When searching across stores by reference number or customer name, matched tokens are hard to locate in dense table rows.
- **Recommendation**: Add highlighted text spans that visually highlight matched search substrings in reference numbers and counterparty names.
- **Impact**: Speeds up dispute verification and customer payment reconciliation.

---

## 5. Transaction Search Date Range Presets
- **Context**: Cross-store search query searches all historical transactions without date bounding.
- **Recommendation**: Provide quick date presets (`Today`, `Last 7 Days`, `Last 30 Days`, `All Time`) to narrow down high-frequency searches.
- **Impact**: Improves response speed and reduces database query scan volume on large ledgers.

---

## 6. Real-Time Platform System Health & API Telemetry Widget
- **Context**: Admins have to infer Gemini API health from ledger anomalies.
- **Recommendation**: Introduce a header telemetry badge indicating platform operational health, Gemini API availability, and database connectivity.
- **Impact**: Instant triage during upstream AI provider degradation.

---

## 7. Extraction Failure Severity Triage & Direct Filter Link
- **Context**: `ExtractionFailuresPanel` displays failures but lacks clear severity thresholds and 1-click drill-down.
- **Recommendation**: Categorize failures with severity badges (`Normal <2%`, `Elevated 2-5%`, `Critical >5%`) and provide direct links to filter cross-store search for that store.
- **Impact**: Rapid identification of prompt regressions or abnormal merchant receipt formats.

---

## 8. Store Usage Tier & Volume Categorization
- **Context**: All stores appear homogenous regardless of transaction volume.
- **Recommendation**: Add Store Volume Tier badges (`Starter < 100/mo`, `Growth 100-1k/mo`, `Enterprise > 1k/mo`) based on 30-day extraction volumes.
- **Impact**: Identifies high-value accounts needing dedicated account management.

---

## 9. Bulk Credit Grant Safety Preview & Impact Calculator
- **Context**: Bulk credit distribution modifies multiple accounts with a single click.
- **Recommendation**: Add a confirmation preview modal displaying total credits to be distributed, total USD cost value, and affected store list before dispatching mutation.
- **Impact**: Prevents accidental over-allocation of platform credits.

---

## 10. Audit Log Action Badging, Filtering & CSV Export
- **Context**: Admin audit logs are text-heavy and cannot be exported for compliance reviews.
- **Recommendation**: Add action-type color badges (Credit Grant, Store Suspend, Fee Tier Change, Broadcast), filtering by admin user, and 1-click CSV audit log export.
- **Impact**: Meets enterprise compliance and auditability standards.

---

## 11. Broadcast Message Live Preview & Priority Badges
- **Context**: System broadcast announcements are typed in markdown without a visual preview of how merchants will see it.
- **Recommendation**: Add a live banner preview component showing formatted alert markdown with priority styles (Info, Warning, Critical).
- **Impact**: Eliminates formatting errors in public-facing merchant announcements.

---

## 12. Quick Suspension Reason Presets
- **Context**: Admins manually type suspension reasons, resulting in inconsistent audit logs.
- **Recommendation**: Provide predefined suspension reason chips (`Non-payment / Inactive`, `Terms of Service Violation`, `Suspicious / Fraudulent Activity`, `Requested by Store Owner`) with custom note appending.
- **Impact**: Standardizes compliance tracking and reporting.

---

## 13. Store Detail Quick Metadata Copy Utilities
- **Context**: Admins frequently copy Store UUIDs, slugs, and webhook endpoints when debugging.
- **Recommendation**: Add 1-click copy buttons with interactive toast confirmations on Store ID and Store Slug in the store header.
- **Impact**: Streamlines developer/support handoffs.

---

## 14. Fee Tier Interactive Comparison Matrix
- **Context**: Store fee configurations are difficult to compare against platform defaults.
- **Recommendation**: Display an inline fee structure comparison card highlighting customized fee rates vs default tiers.
- **Impact**: Clarifies billing terms during merchant contract reviews.

---

## 15. Rich Illustrated Zero-State & Search Empty States
- **Context**: Empty search or filter states displayed generic unstyled plain text.
- **Recommendation**: Add clean, contextual empty-state illustrations with actionable clear-filter buttons.
- **Impact**: Improves overall UI polish and user orientation.

---

---

## 16. Cost Anomaly Alert Badging
- **Context**: Sudden spikes in Gemini extraction costs can go unnoticed until month-end.
- **Recommendation**: Add automated anomaly badges on monthly cost reports when monthly extraction costs increase by >30% over the trailing baseline.
- **Impact**: Proactive margin protection for platform operators.

---

# Implementation Status Matrix

| # | Update Recommendation | Implementation File(s) | Tests / Verification | Status |
|---|------------------------|-------------------------|----------------------|--------|
| 1 | Store Health Score & Triage | `src/lib/admin-health.ts`, `src/components/admin/admin-health-badge.tsx` | `src/lib/admin-health.test.ts` (7 tests) | ✅ Implemented |
| 2 | Balance & Status Quick Filters | `src/components/admin/stores-overview-table.tsx` | Interactive UI verified | ✅ Implemented |
| 3 | Inline Row Actions Menu | `src/components/admin/store-quick-actions-menu.tsx` | Interactive dropdown verified | ✅ Implemented |
| 4 | Search Query Highlighting | `src/lib/highlight.ts`, `src/components/admin/highlighted-text.tsx` | `src/lib/highlight.test.ts` (5 tests) | ✅ Implemented |
| 5 | Search Hints & Suggestions | `src/components/admin/transaction-search-box.tsx` | Fast query presets verified | ✅ Implemented |
| 6 | System Telemetry Status Pill | `src/components/admin/admin-system-health.tsx` | Layout header integration | ✅ Implemented |
| 7 | Extraction Severity Badges | `src/components/admin/extraction-failures-panel.tsx` | Severity thresholds mapped | ✅ Implemented |
| 8 | Store Usage Volume Tiers | `src/components/admin/store-tier-badge.tsx` | Dynamic thresholds mapped | ✅ Implemented |
| 9 | Bulk Grant Impact Preview | `src/components/admin/bulk-grant-credits-dialog.tsx` | Formula preview & presets | ✅ Implemented |
| 10 | Audit Log Action Badges & CSV | `src/lib/admin-audit-format.ts`, `src/components/admin/admin-audit-csv-export.tsx` | `src/lib/admin-audit-format.test.ts` (4 tests) | ✅ Implemented |
| 11 | Broadcast Live Preview & Priority | `src/components/admin/broadcast-composer.tsx` | Live markdown & styling preview | ✅ Implemented |
| 12 | Suspension Reason Presets | `src/components/admin/store-suspend-card.tsx` | 4 standardized presets | ✅ Implemented |
| 13 | Metadata One-Click Copy Badges | `src/components/admin/copy-badge.tsx` | Clipboard API + animated feedback | ✅ Implemented |
| 14 | Fee Tier Matrix Card | `src/components/admin/store-fee-matrix.tsx` | Platform default vs custom tier comparison | ✅ Implemented |
| 15 | Rich Empty State Indicators | `src/components/admin/admin-empty-state.tsx` | Search & audit empty view polish | ✅ Implemented |
| 16 | Cost Surge Anomaly Indicator | `src/components/admin/cost-report-panel.tsx` | +30% threshold alert | ✅ Implemented |
| 17 | Modular Stores CSV Generator | `src/lib/admin-export.ts` | `src/lib/admin-export.test.ts` (3 tests) | ✅ Implemented |
| 18 | KPI Loading Skeleton Grid | `src/components/admin/admin-kpi-tile-skeleton.tsx` | Zero CLS loading transitions | ✅ Implemented |
| 19 | Admin Nav Counter Badges | `src/components/admin/admin-nav.tsx` | Dynamic badge prop support | ✅ Implemented |
| 20 | Platform Health & Stats Card | `src/components/admin/admin-quick-summary.tsx` | Store health distribution widget | ✅ Implemented |
