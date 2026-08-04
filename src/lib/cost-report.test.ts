import { describe, it, expect } from "vitest";
import { buildCostReport, periodStatsToCsv } from "./cost-report";

// "now" pinned to 2026-07-27T03:00:00Z — a Manila Monday (11:00 AM local),
// matching the fixture date used across time.test.ts.
const NOW = new Date("2026-07-27T03:00:00Z");

function entry(created_at: string, cost_usd: number, credit_delta: number) {
  return { created_at, cost_usd, credit_delta };
}

describe("buildCostReport", () => {
  it("buckets entries into today/yesterday daily totals", () => {
    const report = buildCostReport(
      [
        entry("2026-07-27T04:00:00Z", 0.01, -2), // today, Manila 12pm
        entry("2026-07-27T05:00:00Z", 0.02, -3), // today
        entry("2026-07-26T04:00:00Z", 0.05, -1), // yesterday
      ],
      NOW
    );

    expect(report.today).toEqual({ costUsd: 0.03, credits: 5, requests: 2 });
    expect(report.yesterday).toEqual({ costUsd: 0.05, credits: 1, requests: 1 });
  });

  it("takes the absolute value of credit_delta (stored negative for consumption)", () => {
    const report = buildCostReport([entry("2026-07-27T04:00:00Z", 0.01, -7)], NOW);
    expect(report.today.credits).toBe(7);
  });

  it("buckets this-week vs last-week correctly across the Monday boundary", () => {
    const report = buildCostReport(
      [
        entry("2026-07-27T04:00:00Z", 0.1, -1), // this week (Mon)
        entry("2026-07-26T04:00:00Z", 0.2, -1), // last week (Sun, prior week)
      ],
      NOW
    );

    expect(report.thisWeek.costUsd).toBeCloseTo(0.1);
    expect(report.lastWeek.costUsd).toBeCloseTo(0.2);
  });

  it("buckets this-month vs last-month correctly", () => {
    const report = buildCostReport(
      [
        entry("2026-07-01T04:00:00Z", 0.1, -1), // this month
        entry("2026-06-30T04:00:00Z", 0.2, -1), // last month
      ],
      NOW
    );

    expect(report.thisMonth.costUsd).toBeCloseTo(0.1);
    expect(report.lastMonth.costUsd).toBeCloseTo(0.2);
  });

  it("returns a fixed-length daily window with zero-filled gaps", () => {
    const report = buildCostReport([entry("2026-07-27T04:00:00Z", 0.5, -1)], NOW);
    expect(report.daily).toHaveLength(30);
    expect(report.daily[29]).toMatchObject({ key: "2026-07-27", costUsd: 0.5, requests: 1 });
    expect(report.daily[28]).toMatchObject({ key: "2026-07-26", costUsd: 0, requests: 0 });
  });

  it("returns a fixed-length weekly window", () => {
    const report = buildCostReport([], NOW);
    expect(report.weekly).toHaveLength(12);
    expect(report.weekly[11].key).toBe("2026-07-27");
    expect(report.weekly[11]).toMatchObject({ costUsd: 0, credits: 0, requests: 0 });
  });

  it("returns a fixed-length monthly window", () => {
    const report = buildCostReport([], NOW);
    expect(report.monthly).toHaveLength(12);
    expect(report.monthly[11].key).toBe("2026-07");
  });

  it("handles an empty entry list without throwing", () => {
    const report = buildCostReport([], NOW);
    expect(report.today).toEqual({ costUsd: 0, credits: 0, requests: 0 });
    expect(report.thisMonth).toEqual({ costUsd: 0, credits: 0, requests: 0 });
  });
});

describe("periodStatsToCsv", () => {
  const stats = [
    { key: "2026-07-26", label: "Jul 26", costUsd: 0.0123, credits: 4, requests: 2 },
    { key: "2026-07-27", label: "Jul 27", costUsd: 0, credits: 0, requests: 0 },
  ];

  it("prepends a UTF-8 BOM so spreadsheet apps auto-detect the encoding", () => {
    expect(periodStatsToCsv(stats, "Day")).toMatch(/^﻿/);
  });

  it("includes a header row using the given period label", () => {
    const csv = periodStatsToCsv(stats, "Day");
    const [header] = csv.replace(/^﻿/, "").split("\n");
    expect(header).toBe("Day,Requests,Credits,Cost (USD)");
  });

  it("renders one row per stat, oldest first, cost to 6 decimals", () => {
    const csv = periodStatsToCsv(stats, "Day");
    const lines = csv.replace(/^﻿/, "").split("\n");
    expect(lines[1]).toBe("Jul 26,2,4,0.012300");
    expect(lines[2]).toBe("Jul 27,0,0,0.000000");
  });
});
