"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-hairline bg-canvas px-4 sm:px-6">
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="mr-2 flex size-9 items-center justify-center rounded-pill text-ink md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <Link href="/dashboard" className="mr-8 text-lg font-semibold text-ink">
        PesoTrace
      </Link>

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
        <UserMenu email={email} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-3/4 max-w-xs">
          <SheetHeader>
            <SheetTitle>PesoTrace</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-pill px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-surface-strong text-primary" : "text-body"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
