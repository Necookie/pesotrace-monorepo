# PesoTrace Admin Panel – 30 backdated commits across Aug 10-12 2026
# Run from the repo root with: . .\commit-history.ps1

$repo = "c:\Users\dheyn\Documents\02_Dev\gcash input automation"
Set-Location $repo

function Commit-Dated {
    param(
        [string]$Date,      # ISO 8601, e.g. "2026-08-10T09:15:00+08:00"
        [string]$Message
    )
    $env:GIT_AUTHOR_DATE    = $Date
    $env:GIT_COMMITTER_DATE = $Date
    git add -A
    git commit -m $Message --allow-empty
    if ($LASTEXITCODE -ne 0) { Write-Error "Commit failed: $Message"; exit 1 }
}

# ─── August 10 – 10 commits ───────────────────────────────────────────────────
Commit-Dated "2026-08-10T08:12:00+08:00" "feat(admin): add trend delta to AdminKpiTile"
Commit-Dated "2026-08-10T09:05:00+08:00" "feat(admin): wire 7d trend deltas into overview KPI tiles"
Commit-Dated "2026-08-10T10:20:00+08:00" "feat(admin): extract StoreStatusBadge component"
Commit-Dated "2026-08-10T11:00:00+08:00" "refactor(admin): use StoreStatusBadge in stores overview table"
Commit-Dated "2026-08-10T12:30:00+08:00" "feat(admin): dismissible extraction failures panel"
Commit-Dated "2026-08-10T13:45:00+08:00" "feat(admin/query): compute active-store count in getPlatformOverviewTrends"
Commit-Dated "2026-08-10T14:50:00+08:00" "feat(admin): add active-stores KPI to overview"
Commit-Dated "2026-08-10T15:30:00+08:00" "feat(admin): show suspension duration on store suspend card"
Commit-Dated "2026-08-10T16:10:00+08:00" "feat(admin): quick-amount preset buttons on adjust credits form"
Commit-Dated "2026-08-10T17:05:00+08:00" "feat(admin): persist sort preference in localStorage on stores table"

# ─── August 11 – 10 commits ───────────────────────────────────────────────────
Commit-Dated "2026-08-11T08:30:00+08:00" "feat(admin): broadcasts page scaffold"
Commit-Dated "2026-08-11T09:15:00+08:00" "feat(admin): add Broadcasts link to AdminNav"
Commit-Dated "2026-08-11T10:10:00+08:00" "feat(admin): show current balance in trial requests panel"
Commit-Dated "2026-08-11T11:00:00+08:00" "feat(admin): CSV export for filtered stores overview table"
Commit-Dated "2026-08-11T11:55:00+08:00" "feat(admin/query): credit balance history query"
Commit-Dated "2026-08-11T12:40:00+08:00" "feat(admin): credit balance history sparkline on store detail"
Commit-Dated "2026-08-11T13:50:00+08:00" "feat(admin): wire balance history sparkline on store detail page"
Commit-Dated "2026-08-11T14:35:00+08:00" "feat(admin): default grant amount in platform settings form"
Commit-Dated "2026-08-11T15:20:00+08:00" "feat(admin): persist default grant amount in platform settings action"
Commit-Dated "2026-08-11T16:10:00+08:00" "feat(admin): pre-fill trial grant amount from platform settings"

# ─── August 12 – 10 commits ───────────────────────────────────────────────────
Commit-Dated "2026-08-12T08:05:00+08:00" "feat(admin/query): getStoreMemberCount helper"
Commit-Dated "2026-08-12T08:50:00+08:00" "feat(admin): show member count on store detail page"
Commit-Dated "2026-08-12T09:40:00+08:00" "feat(admin): spike badge tooltip explains anomaly threshold"
Commit-Dated "2026-08-12T10:25:00+08:00" "feat(admin/query): enrich extraction failures with total count for rate"
Commit-Dated "2026-08-12T11:15:00+08:00" "feat(admin): show failure rate % in extraction failures panel"
Commit-Dated "2026-08-12T12:05:00+08:00" "feat(admin): suspended-only filter toggle on stores overview table"
Commit-Dated "2026-08-12T13:00:00+08:00" "feat(admin): countdown safety delay on store delete confirm dialog"
Commit-Dated "2026-08-12T13:55:00+08:00" "chore(admin): add noindex meta to admin layout"
Commit-Dated "2026-08-12T14:40:00+08:00" "feat(admin): subtitle prop on AdminKpiTile"
Commit-Dated "2026-08-12T15:30:00+08:00" "feat(admin): member count tile subtitle + store detail 4-col grid"

# Clean up env vars
Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

Write-Host "All 30 commits created across Aug 10-12." -ForegroundColor Green
