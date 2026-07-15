import type { TransactionCategory } from "@/lib/database.types";

export const CATEGORY_CHART_COLORS: Record<TransactionCategory, string> = {
  cash_in: "var(--color-up)",
  cash_out: "var(--color-down)",
  load: "var(--color-primary)",
  bills: "var(--color-chart-bills)",
  other: "var(--color-chart-other)",
};

export const CHART_INK = "var(--color-ink)";
export const CHART_MUTED = "var(--color-muted)";
export const CHART_GRIDLINE = "var(--color-hairline)";
