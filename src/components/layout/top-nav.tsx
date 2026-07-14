"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ledger", label: "Ledger" },
  { href: "/upload", label: "Upload" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function TopNav({ storeName, email }: { storeName: string; email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-hairline bg-canvas px-6">
      <Link href="/dashboard" className="mr-8 text-lg font-semibold text-ink">
        PesoTrace
      </Link>
      <nav className="flex flex-1 items-center gap-1">
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
      <div className="flex items-center gap-3">
        <span className="hidden rounded-pill bg-surface-strong px-3 py-1.5 text-xs font-medium text-ink sm:inline">
          {storeName}
        </span>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
