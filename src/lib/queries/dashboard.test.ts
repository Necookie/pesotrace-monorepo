import { describe, it, expect } from "vitest";
import { dailyIncomeFromRows } from "./dashboard";

// The reference "now": 2026-07-27 12:00 Manila (04:00 UTC).
const NOW = new Date("2026-07-27T04:00:00Z");

function row(occurred_at: string, fee: number) {
  return { occurred_at, fee_computed: fee };
}

describe("dailyIncomeFromRows", () => {
  it("sums today's income by Manila day", () => {
    const result = dailyIncomeFromRows(
      [
        row("2026-07-27T02:00:00Z", 20), // Jul 27 Manila
        row("2026-07-27T03:30:00Z", 15), // Jul 27 Manila
      ],
      NOW
    );
    expect(result.todayIncome).toBe(35);
  });

  it("counts a late-evening-UTC transaction as the next Manila day", () => {
    // 2026-07-26T22:00Z is 2026-07-27 06:00 Manila — today, not yesterday.
    const result = dailyIncomeFromRows([row("2026-07-26T22:00:00Z", 50)], NOW);
    expect(result.todayIncome).toBe(50);
  });

  it("computes the delta versus yesterday's income", () => {
    const result = dailyIncomeFromRows(
      [
        row("2026-07-27T02:00:00Z", 30), // today
        row("2026-07-26T05:00:00Z", 20), // yesterday (Jul 26 Manila)
      ],
      NOW
    );
    expect(result.todayIncomeDelta.current).toBe(30);
    expect(result.todayIncomeDelta.previous).toBe(20);
    expect(result.todayIncomeDelta.pct).toBeCloseTo(50);
  });

  it("returns a null delta pct when there was no income yesterday", () => {
    const result = dailyIncomeFromRows([row("2026-07-27T02:00:00Z", 30)], NOW);
    expect(result.todayIncomeDelta.pct).toBeNull();
  });

  it("returns a zero-filled 7-day series ending today, oldest first", () => {
    const result = dailyIncomeFromRows([row("2026-07-27T02:00:00Z", 40)], NOW);
    expect(result.dailyIncome).toHaveLength(7);
    expect(result.dailyIncome[0].day).toBe("2026-07-21");
    expect(result.dailyIncome[6].day).toBe("2026-07-27");
    expect(result.dailyIncome[6].income).toBe(40);
    expect(result.dailyIncome[6].count).toBe(1);
    // A day with no transactions is present with zeros, not missing.
    expect(result.dailyIncome[0].income).toBe(0);
    expect(result.dailyIncome[0].count).toBe(0);
  });

  it("labels each day for display", () => {
    const result = dailyIncomeFromRows([], NOW);
    expect(result.dailyIncome[6].label).toBe("Jul 27");
    expect(result.dailyIncome[0].label).toBe("Jul 21");
  });

  it("ignores transactions older than the 7-day window for the series but not for today", () => {
    const result = dailyIncomeFromRows(
      [
        row("2026-07-10T02:00:00Z", 99), // outside the 7-day window
        row("2026-07-27T02:00:00Z", 25),
      ],
      NOW
    );
    expect(result.dailyIncome.some((d) => d.income === 99)).toBe(false);
    expect(result.todayIncome).toBe(25);
  });

  it("handles an empty ledger", () => {
    const result = dailyIncomeFromRows([], NOW);
    expect(result.todayIncome).toBe(0);
    expect(result.dailyIncome.every((d) => d.income === 0 && d.count === 0)).toBe(true);
  });
});
