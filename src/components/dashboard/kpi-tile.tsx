import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  deltaPct,
}: {
  label: string;
  value: string;
  deltaPct?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6 min-w-0">
      <p className="text-xs sm:text-sm text-muted truncate">{label}</p>
      <p className="mt-1.5 font-mono text-lg font-medium text-ink sm:text-2xl truncate" title={value}>
        {value}
      </p>
      {deltaPct !== undefined && (
        <p
          className={cn(
            "mt-1 flex items-center gap-0.5 text-xs font-medium",
            deltaPct === null && "text-muted",
            deltaPct !== null && deltaPct >= 0 && "text-up",
            deltaPct !== null && deltaPct < 0 && "text-down"
          )}
        >
          {deltaPct === null ? (
            "vs. prior 30d — no prior data"
          ) : (
            <>
              {deltaPct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(deltaPct).toFixed(1)}% vs. prior 30d
            </>
          )}
        </p>
      )}
    </div>
  );
}
