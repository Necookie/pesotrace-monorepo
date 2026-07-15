"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/settings/fee-tiers", label: "Fee tiers" },
  { href: "/settings/phone-numbers", label: "Phone numbers" },
  { href: "/settings/branches", label: "Branches" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:flex-row sm:gap-8 sm:p-6">
      <aside className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:space-y-1 sm:overflow-visible">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-surface-strong text-primary"
                  : "text-body hover:bg-surface-strong hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Retention policy
        </div>
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Branding
        </div>
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Notifications
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
