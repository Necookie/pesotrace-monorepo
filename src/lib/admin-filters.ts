import type {
  AdminTransactionFilterParams,
} from "@/lib/queries/admin-types";
import type {
  TransactionDirection,
  TransactionCategory,
  TransactionStatus,
  TransactionSource,
} from "@/lib/database.types";
import { storeToday } from "@/lib/time";

export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "all" | "custom";

export interface ResolvedDateRange {
  preset: DateRangePreset;
  startIso: string | null;
  endIso: string | null;
  label: string;
}

export function resolveAdminDateRange(
  preset: string | undefined,
  customStart?: string | null,
  customEnd?: string | null,
  now = new Date()
): ResolvedDateRange {
  const normalizedPreset: DateRangePreset =
    preset === "today" || preset === "7d" || preset === "30d" || preset === "90d" || preset === "custom"
      ? preset
      : preset === "all"
      ? "all"
      : "30d";

  if (normalizedPreset === "all") {
    return { preset: "all", startIso: null, endIso: null, label: "All time" };
  }

  if (normalizedPreset === "today") {
    const todayKey = storeToday(now);
    // Manila start of day is todayKey 00:00:00 +08:00
    const startIso = new Date(`${todayKey}T00:00:00+08:00`).toISOString();
    const endIso = new Date(`${todayKey}T23:59:59.999+08:00`).toISOString();
    return { preset: "today", startIso, endIso, label: "Today" };
  }

  if (normalizedPreset === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { preset: "7d", startIso: start.toISOString(), endIso: now.toISOString(), label: "Last 7 days" };
  }

  if (normalizedPreset === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { preset: "30d", startIso: start.toISOString(), endIso: now.toISOString(), label: "Last 30 days" };
  }

  if (normalizedPreset === "90d") {
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { preset: "90d", startIso: start.toISOString(), endIso: now.toISOString(), label: "Last 90 days" };
  }

  // Custom
  let startIso: string | null = null;
  let endIso: string | null = null;

  if (customStart) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(customStart)) {
      startIso = new Date(`${customStart}T00:00:00+08:00`).toISOString();
    } else {
      const parsed = new Date(customStart);
      if (!isNaN(parsed.getTime())) startIso = parsed.toISOString();
    }
  }

  if (customEnd) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(customEnd)) {
      endIso = new Date(`${customEnd}T23:59:59.999+08:00`).toISOString();
    } else {
      const parsed = new Date(customEnd);
      if (!isNaN(parsed.getTime())) endIso = parsed.toISOString();
    }
  }

  return {
    preset: "custom",
    startIso,
    endIso,
    label: startIso && endIso ? "Custom range" : "All time",
  };
}

export function parseAdminTransactionFilters(
  params: Record<string, string | string[] | undefined>
): AdminTransactionFilterParams {
  const getSingle = (val: string | string[] | undefined): string | undefined =>
    Array.isArray(val) ? val[0] : val;

  const q = getSingle(params.q)?.trim() || undefined;
  const storeId = getSingle(params.storeId)?.trim() || undefined;
  const createdBy = getSingle(params.createdBy)?.trim() || undefined;

  const rawDir = getSingle(params.direction);
  const direction: TransactionDirection | undefined =
    rawDir === "send" || rawDir === "receive" ? rawDir : undefined;

  const rawCat = getSingle(params.category);
  const category: TransactionCategory | undefined =
    rawCat === "cash_in" || rawCat === "cash_out" || rawCat === "load" || rawCat === "bills" || rawCat === "other"
      ? rawCat
      : undefined;

  const rawStatus = getSingle(params.status);
  const status: TransactionStatus | undefined =
    rawStatus === "confirmed" || rawStatus === "needs_review" ? rawStatus : undefined;

  const rawSource = getSingle(params.sourceType);
  const sourceType: TransactionSource | undefined =
    rawSource === "screenshot" || rawSource === "statement" || rawSource === "manual" ? rawSource : undefined;

  const rawDateRange = getSingle(params.dateRange);
  const dateRange: AdminTransactionFilterParams["dateRange"] =
    rawDateRange === "today" ||
    rawDateRange === "7d" ||
    rawDateRange === "30d" ||
    rawDateRange === "90d" ||
    rawDateRange === "all" ||
    rawDateRange === "custom"
      ? rawDateRange
      : undefined;

  const startDate = getSingle(params.startDate)?.trim() || undefined;
  const endDate = getSingle(params.endDate)?.trim() || undefined;

  const rawMin = getSingle(params.minAmount);
  const minAmount = rawMin && !isNaN(Number(rawMin)) ? Number(rawMin) : undefined;

  const rawMax = getSingle(params.maxAmount);
  const maxAmount = rawMax && !isNaN(Number(rawMax)) ? Number(rawMax) : undefined;

  const rawSortBy = getSingle(params.sortBy);
  const sortBy: AdminTransactionFilterParams["sortBy"] =
    rawSortBy === "occurred_at" || rawSortBy === "amount" || rawSortBy === "fee_computed" || rawSortBy === "created_at"
      ? rawSortBy
      : "occurred_at";

  const rawSortDir = getSingle(params.sortDir);
  const sortDir: "asc" | "desc" = rawSortDir === "asc" ? "asc" : "desc";

  const rawPage = getSingle(params.page);
  const page = rawPage && !isNaN(parseInt(rawPage, 10)) && parseInt(rawPage, 10) > 0 ? parseInt(rawPage, 10) : 1;

  const rawPageSize = getSingle(params.pageSize);
  const pageSize =
    rawPageSize && !isNaN(parseInt(rawPageSize, 10)) && parseInt(rawPageSize, 10) > 0
      ? Math.min(100, parseInt(rawPageSize, 10))
      : 25;

  return {
    q,
    storeId,
    createdBy,
    direction,
    category,
    status,
    sourceType,
    dateRange,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortDir,
    page,
    pageSize,
  };
}

export function buildAdminFilterSearchQuery(
  filters: Partial<AdminTransactionFilterParams>,
  overrides: Partial<AdminTransactionFilterParams> = {}
): string {
  const merged = { ...filters, ...overrides };
  const search = new URLSearchParams();

  if (merged.q) search.set("q", merged.q);
  if (merged.storeId) search.set("storeId", merged.storeId);
  if (merged.createdBy) search.set("createdBy", merged.createdBy);
  if (merged.direction) search.set("direction", merged.direction);
  if (merged.category) search.set("category", merged.category);
  if (merged.status) search.set("status", merged.status);
  if (merged.sourceType) search.set("sourceType", merged.sourceType);
  if (merged.dateRange && merged.dateRange !== "30d") search.set("dateRange", merged.dateRange);
  if (merged.startDate) search.set("startDate", merged.startDate);
  if (merged.endDate) search.set("endDate", merged.endDate);
  if (merged.minAmount !== undefined) search.set("minAmount", String(merged.minAmount));
  if (merged.maxAmount !== undefined) search.set("maxAmount", String(merged.maxAmount));
  if (merged.sortBy && merged.sortBy !== "occurred_at") search.set("sortBy", merged.sortBy);
  if (merged.sortDir && merged.sortDir !== "desc") search.set("sortDir", merged.sortDir);
  if (merged.page && merged.page > 1) search.set("page", String(merged.page));
  if (merged.pageSize && merged.pageSize !== 25) search.set("pageSize", String(merged.pageSize));

  const str = search.toString();
  return str ? `?${str}` : "";
}
