import { describe, it, expect } from "vitest";
import { formatDateTime, formatDate, formatRelativeTime } from "./format";

describe("formatDateTime", () => {
  it("renders the stored wall-clock time, not a timezone-shifted one", () => {
    // 7:00 PM on a receipt is stored as "...T19:00:00Z". It must display as
    // 7:00 PM regardless of the host timezone — the bug was a Manila host
    // shifting it +8h to 3:00 AM.
    const out = formatDateTime("2026-07-27T19:00:00Z");
    expect(out).toContain("7:00");
    expect(out).toContain("PM");
    expect(out).toContain("Jul 27");
    expect(out).not.toContain("AM");
  });

  it("renders an early-morning time as AM on the same day", () => {
    const out = formatDateTime("2026-07-27T04:36:00Z");
    expect(out).toContain("4:36");
    expect(out).toContain("AM");
    expect(out).toContain("Jul 27");
  });

  it("renders noon and midnight correctly", () => {
    expect(formatDateTime("2026-07-27T12:00:00Z")).toContain("12:00");
    expect(formatDateTime("2026-07-27T12:00:00Z")).toContain("PM");
    expect(formatDateTime("2026-07-27T00:00:00Z")).toContain("12:00");
    expect(formatDateTime("2026-07-27T00:00:00Z")).toContain("AM");
  });

  it("returns the raw input for an unparseable value", () => {
    expect(formatDateTime("not a date")).toBe("not a date");
  });
});

describe("formatDate", () => {
  it("renders the stored date without shifting across midnight", () => {
    expect(formatDate("2026-07-27T23:30:00Z")).toContain("Jul 27");
    expect(formatDate("2026-07-27T23:30:00Z")).toContain("2026");
  });

  it("formats a date-only key on its own day", () => {
    expect(formatDate("2026-01-01")).toContain("Jan 1");
  });
});

describe("formatRelativeTime", () => {
  const baseNow = new Date("2026-08-12T12:00:00Z");

  it("handles null, undefined, or invalid dates", () => {
    expect(formatRelativeTime(null, baseNow)).toBe("Never");
    expect(formatRelativeTime(undefined, baseNow)).toBe("Never");
    expect(formatRelativeTime("invalid", baseNow)).toBe("Never");
  });

  it("formats recent times under an hour", () => {
    expect(formatRelativeTime("2026-08-12T11:59:45Z", baseNow)).toBe("Just now");
    expect(formatRelativeTime("2026-08-12T11:45:00Z", baseNow)).toBe("15m ago");
  });

  it("formats hours and days ago", () => {
    expect(formatRelativeTime("2026-08-12T09:00:00Z", baseNow)).toBe("3h ago");
    expect(formatRelativeTime("2026-08-10T12:00:00Z", baseNow)).toBe("2d ago");
  });
});
