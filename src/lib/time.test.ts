import { describe, it, expect } from "vitest";
import {
  storeDayKey,
  storeToday,
  previousDayKey,
  recentDayKeys,
  formatDayKeyShort,
  storeWeekKey,
  storeMonthKey,
  formatWeekKeyShort,
  formatMonthKeyShort,
} from "./time";

describe("storeDayKey", () => {
  it("buckets an instant by its Manila calendar day, not UTC", () => {
    // 2026-07-26T22:00:00Z is 2026-07-27 06:00 in Manila (UTC+8).
    expect(storeDayKey("2026-07-26T22:00:00Z")).toBe("2026-07-27");
  });

  it("keeps a mid-afternoon UTC instant on the same Manila day", () => {
    expect(storeDayKey("2026-07-27T03:00:00Z")).toBe("2026-07-27");
  });

  it("rolls to the next Manila day exactly at 16:00 UTC", () => {
    // 16:00 UTC == 00:00 next day in Manila.
    expect(storeDayKey("2026-07-27T15:59:59Z")).toBe("2026-07-27");
    expect(storeDayKey("2026-07-27T16:00:00Z")).toBe("2026-07-28");
  });

  it("accepts a Date as well as an ISO string", () => {
    expect(storeDayKey(new Date("2026-07-26T22:00:00Z"))).toBe("2026-07-27");
  });
});

describe("storeToday", () => {
  it("returns the Manila day for a given instant", () => {
    expect(storeToday(new Date("2026-07-26T20:00:00Z"))).toBe("2026-07-27");
  });
});

describe("previousDayKey", () => {
  it("steps back one calendar day", () => {
    expect(previousDayKey("2026-07-27")).toBe("2026-07-26");
  });

  it("crosses a month boundary", () => {
    expect(previousDayKey("2026-08-01")).toBe("2026-07-31");
  });

  it("crosses a year boundary", () => {
    expect(previousDayKey("2026-01-01")).toBe("2025-12-31");
  });

  it("handles a leap day correctly", () => {
    expect(previousDayKey("2028-03-01")).toBe("2028-02-29");
  });
});

describe("recentDayKeys", () => {
  it("returns N days ending today, oldest first", () => {
    const keys = recentDayKeys(7, new Date("2026-07-27T04:00:00Z"));
    expect(keys).toEqual([
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
      "2026-07-25",
      "2026-07-26",
      "2026-07-27",
    ]);
  });

  it("ends on the Manila day, not the UTC day", () => {
    const keys = recentDayKeys(1, new Date("2026-07-26T20:00:00Z"));
    expect(keys).toEqual(["2026-07-27"]);
  });
});

describe("formatDayKeyShort", () => {
  it("formats a day key without shifting across a timezone boundary", () => {
    // The bug this guards against: new Date("2026-07-27") is UTC midnight,
    // which a PH-locale formatter would otherwise render as Jul 26.
    expect(formatDayKeyShort("2026-07-27")).toBe("Jul 27");
    expect(formatDayKeyShort("2026-01-01")).toBe("Jan 1");
  });
});

describe("storeWeekKey", () => {
  // 2026-07-27 is a Manila Monday — verified against grouping.test.ts's own
  // fixture of the same date.
  it("returns the Monday itself for an instant that's already that Monday", () => {
    expect(storeWeekKey("2026-07-27T03:00:00Z")).toBe("2026-07-27");
  });

  it("buckets a later day in the same week onto that Monday", () => {
    expect(storeWeekKey("2026-07-31T03:00:00Z")).toBe("2026-07-27");
  });

  it("buckets a Sunday onto the Monday that started its week", () => {
    expect(storeWeekKey("2026-07-26T03:00:00Z")).toBe("2026-07-20");
  });
});

describe("storeMonthKey", () => {
  it("returns the Manila calendar month", () => {
    expect(storeMonthKey("2026-07-27T03:00:00Z")).toBe("2026-07");
  });

  it("rolls to the next Manila month across the UTC->Manila day boundary", () => {
    // 16:00 UTC on Jul 31 is already Aug 1 00:00 in Manila.
    expect(storeMonthKey("2026-07-31T16:00:00Z")).toBe("2026-08");
  });
});

describe("formatWeekKeyShort", () => {
  it("formats a Monday-start week as a date range, crossing a month boundary", () => {
    expect(formatWeekKeyShort("2026-07-27")).toBe("Jul 27 – Aug 2");
  });
});

describe("formatMonthKeyShort", () => {
  it("formats a month key without shifting timezone", () => {
    expect(formatMonthKeyShort("2026-07")).toBe("Jul 2026");
  });
});
