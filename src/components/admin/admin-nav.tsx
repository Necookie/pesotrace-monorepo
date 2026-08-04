"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, Search, ScrollText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Stores", icon: Store, exact: true },
  { href: "/admin/search", label: "Search", icon: Search },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-surface-strong text-primary" : "text-body hover:text-ink"
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
