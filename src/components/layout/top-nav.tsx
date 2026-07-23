"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { LogoMark } from "@/components/brand/logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ledger", label: "Ledger" },
  { href: "/upload", label: "Upload" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({
  storeName,
  email,
  creditBalance,
}: {
  storeName: string;
  email: string;
  creditBalance: number;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-hairline bg-canvas px-4 sm:px-6">
      <Link href="/dashboard" className="mr-8 flex items-center gap-2 text-lg font-semibold text-ink">
        <LogoMark size={22} className="text-primary" />
        PesoTrace
      </Link>

      {/* Primary nav lives in BottomNav on mobile (thumb zone) — this row
          only renders at md+ where a bottom tab bar isn't the right pattern. */}
      <nav className="hidden flex-1 items-center gap-1 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-surface-strong text-primary" : "text-body hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-pill bg-surface-strong px-3 py-1.5 text-xs font-medium text-ink sm:inline">
          {storeName}
        </span>
        <Link
          href="/settings/credits"
          className={cn(
            "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors",
            creditBalance <= 0
              ? "border-down/30 bg-down/5 text-down hover:bg-down/10"
              : "border-hairline bg-surface-strong text-ink hover:bg-surface-soft"
          )}
        >
          <span className="font-mono">{creditBalance.toLocaleString()}</span>
          <span className="hidden sm:inline">credits</span>
        </Link>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
