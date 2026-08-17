import { Layers, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type StoreUsageTier = "starter" | "growth" | "enterprise";

export function getStoreUsageTier(extractionsThisMonth: number): {
  tier: StoreUsageTier;
  label: string;
  badgeClass: string;
  icon: typeof Layers;
} {
  if (extractionsThisMonth >= 1000) {
    return {
      tier: "enterprise",
      label: "Enterprise Volume (>1k/mo)",
      badgeClass: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      icon: Building2,
    };
  }
  if (extractionsThisMonth >= 100) {
    return {
      tier: "growth",
      label: "Growth Volume (100–1k/mo)",
      badgeClass: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      icon: Sparkles,
    };
  }
  return {
    tier: "starter",
    label: "Starter Volume (<100/mo)",
    badgeClass: "bg-surface-strong text-muted border-hairline",
    icon: Layers,
  };
}

export function StoreTierBadge({
  extractionsThisMonth,
  className,
}: {
  extractionsThisMonth: number;
  className?: string;
}) {
  const config = getStoreUsageTier(extractionsThisMonth);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.badgeClass,
        className
      )}
    >
      <Icon className="size-3" />
      <span>{config.label}</span>
    </span>
  );
}
