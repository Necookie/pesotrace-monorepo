import { CheckCircle2, AlertCircle, AlertTriangle, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeStoreHealth, type StoreHealthInput, type StoreHealthStatus } from "@/lib/admin-health";

const STATUS_CONFIG: Record<
  StoreHealthStatus,
  {
    icon: typeof CheckCircle2;
    containerClass: string;
    textClass: string;
  }
> = {
  healthy: {
    icon: CheckCircle2,
    containerClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    textClass: "text-emerald-700",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    textClass: "text-amber-700",
  },
  critical: {
    icon: AlertCircle,
    containerClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    textClass: "text-rose-700",
  },
  inactive: {
    icon: Moon,
    containerClass: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    textClass: "text-slate-600",
  },
};

export function StoreHealthBadge({
  store,
  className,
}: {
  store: StoreHealthInput;
  className?: string;
}) {
  const result = computeStoreHealth(store);
  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;

  return (
    <span
      title={result.reason}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        config.containerClass,
        className
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span className={config.textClass}>{result.label}</span>
    </span>
  );
}
