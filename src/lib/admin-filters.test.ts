import { describe, it, expect } from "vitest";
import {
  resolveAdminDateRange,
  parseAdminTransactionFilters,
  buildAdminFilterSearchQuery,
} from "./admin-filters";

describe("resolveAdminDateRange", () => {
  const fixedNow = new Date("2026-08-18T12:00:00.000Z");

  it("resolves 'today' correctly", () => {
    const res = resolveAdminDateRange("today", null, null, fixedNow);
    expect(res.preset).toBe("today");
    expect(res.startIso).toBeTruthy();
    expect(res.endIso).toBeTruthy();
  });

  it("resolves '7d' correctly", () => {
    const res = resolveAdminDateRange("7d", null, null, fixedNow);
    expect(res.preset).toBe("7d");
    expect(res.startIso).toBeTruthy();
    expect(res.endIso).toBe(fixedNow.toISOString());
  });

  it("resolves '30d' as default when undefined", () => {
    const res = resolveAdminDateRange(undefined, null, null, fixedNow);
    expect(res.preset).toBe("30d");
  });

  it("resolves 'all' with null start and end", () => {
    const res = resolveAdminDateRange("all", null, null, fixedNow);
    expect(res.preset).toBe("all");
    expect(res.startIso).toBeNull();
    expect(res.endIso).toBeNull();
  });

  it("resolves custom dates", () => {
    const res = resolveAdminDateRange("custom", "2026-08-01", "2026-08-10", fixedNow);
    expect(res.preset).toBe("custom");
    expect(res.startIso).toBeTruthy();
    expect(res.endIso).toBeTruthy();
  });
});

describe("parseAdminTransactionFilters", () => {
  it("parses empty params with safe defaults", () => {
    const parsed = parseAdminTransactionFilters({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(25);
    expect(parsed.sortBy).toBe("occurred_at");
    expect(parsed.sortDir).toBe("desc");
    expect(parsed.q).toBeUndefined();
  });

  it("parses valid query parameters correctly", () => {
    const parsed = parseAdminTransactionFilters({
      q: "GCASH12345",
      storeId: "store-abc",
      direction: "send",
      category: "cash_in",
      status: "confirmed",
      sourceType: "screenshot",
      dateRange: "7d",
      minAmount: "100",
      maxAmount: "5000",
      page: "2",
      pageSize: "50",
      sortBy: "amount",
      sortDir: "asc",
    });

    expect(parsed.q).toBe("GCASH12345");
    expect(parsed.storeId).toBe("store-abc");
    expect(parsed.direction).toBe("send");
    expect(parsed.category).toBe("cash_in");
    expect(parsed.status).toBe("confirmed");
    expect(parsed.sourceType).toBe("screenshot");
    expect(parsed.dateRange).toBe("7d");
    expect(parsed.minAmount).toBe(100);
    expect(parsed.maxAmount).toBe(5000);
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(50);
    expect(parsed.sortBy).toBe("amount");
    expect(parsed.sortDir).toBe("asc");
  });

  it("sanitizes invalid enums and limits page size", () => {
    const parsed = parseAdminTransactionFilters({
      direction: "invalid_dir" as any,
      category: "invalid_cat" as any,
      status: "invalid_status" as any,
      pageSize: "500",
      page: "-5",
    });

    expect(parsed.direction).toBeUndefined();
    expect(parsed.category).toBeUndefined();
    expect(parsed.status).toBeUndefined();
    expect(parsed.pageSize).toBe(100); // capped at 100
    expect(parsed.page).toBe(1); // floor at 1
  });
});

describe("buildAdminFilterSearchQuery", () => {
  it("builds query string correctly and allows overrides", () => {
    const query = buildAdminFilterSearchQuery(
      { q: "test", direction: "send", page: 2 },
      { page: 3 }
    );
    expect(query).toContain("q=test");
    expect(query).toContain("direction=send");
    expect(query).toContain("page=3");
  });
});
