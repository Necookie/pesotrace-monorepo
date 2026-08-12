"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, Receipt, Upload, BarChart3, Settings, Percent, Users, Phone, Coins, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: "Navigation" | "Settings" | "Admin";
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Overview, KPIs & revenue trends", href: "/dashboard", icon: LayoutDashboard, category: "Navigation" },
  { id: "ledger", label: "Transaction Ledger", description: "Search & filter transactions", href: "/ledger", icon: Receipt, category: "Navigation" },
  { id: "upload", label: "Upload Screenshots", description: "Single/bulk GCash receipt extraction", href: "/upload", icon: Upload, category: "Navigation" },
  { id: "reports", label: "Reports & Analytics", description: "CSV/PDF report builder", href: "/reports", icon: BarChart3, category: "Navigation" },
  { id: "fee-tiers", label: "Fee Tiers", description: "Configure remittance charge tiers", href: "/settings/fee-tiers", icon: Percent, category: "Settings" },
  { id: "team", label: "Team & Staff", description: "Manage members & permissions", href: "/settings/team", icon: Users, category: "Settings" },
  { id: "phone-numbers", label: "Phone Numbers", description: "Store GCash numbers", href: "/settings/phone-numbers", icon: Phone, category: "Settings" },
  { id: "credits", label: "Store Credits", description: "View & request extraction credits", href: "/settings/credits", icon: Coins, category: "Settings" },
  { id: "admin", label: "Admin Console", description: "Platform oversight & cross-store search", href: "/admin", icon: ShieldAlert, category: "Admin" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const filtered = COMMAND_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].href);
    }
  };

  return (
    <>
      {/* Top Nav Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-pill border border-hairline bg-surface-soft px-3 py-1.5 text-xs text-muted hover:text-ink hover:border-muted/40 transition-colors"
      >
        <Search className="size-3.5" />
        <span>Quick action...</span>
        <kbd className="ml-2 rounded border border-hairline bg-canvas px-1.5 py-0.5 text-3xs font-mono text-muted">
          ⌘K
        </kbd>
      </button>

      {/* Backdrop & Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/40 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            className="w-full max-w-lg rounded-2xl border border-hairline bg-canvas shadow-2xl overflow-hidden flex flex-col"
            onKeyDown={handleListKeyDown}
          >
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-hairline px-4 py-3 gap-3">
              <Search className="size-4 text-muted shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or page name..."
                autoFocus
                className="w-full bg-transparent text-sm text-ink placeholder:text-muted outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-muted hover:bg-surface-strong hover:text-ink transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted">No commands match &quot;{query}&quot;</p>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected ? "bg-surface-strong text-ink" : "text-body hover:bg-surface-soft"
                      )}
                    >
                      <div className={cn(
                        "flex size-8 items-center justify-center rounded-lg border border-hairline transition-colors",
                        isSelected ? "bg-primary text-white border-primary" : "bg-canvas text-muted"
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink truncate">{item.label}</span>
                          <span className="text-3xs text-muted uppercase bg-surface-soft px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-hairline bg-surface-soft px-4 py-2 flex items-center justify-between text-3xs text-muted">
              <div className="flex items-center gap-3">
                <span><kbd className="font-mono bg-canvas px-1 rounded border border-hairline">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono bg-canvas px-1 rounded border border-hairline">↵</kbd> select</span>
              </div>
              <span><kbd className="font-mono bg-canvas px-1 rounded border border-hairline">ESC</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
