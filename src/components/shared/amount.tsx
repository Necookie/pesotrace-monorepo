import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/format";

export function Amount({
  value,
  direction,
  className,
}: {
  value: number;
  direction?: "send" | "receive";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums whitespace-nowrap",
        direction === "send" && "text-down",
        direction === "receive" && "text-up",
        className
      )}
    >
      {direction === "send" ? "-" : direction === "receive" ? "+" : ""}
      {formatPeso(value)}
    </span>
  );
}
