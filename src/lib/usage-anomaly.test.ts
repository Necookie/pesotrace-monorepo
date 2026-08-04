import { describe, it, expect } from "vitest";
import { isUsageAnomaly } from "./usage-anomaly";

describe("isUsageAnomaly", () => {
  it("never flags below the minimum request floor, even with zero prior activity", () => {
    expect(isUsageAnomaly(4, [0, 0, 0, 0, 0, 0, 0])).toBe(false);
  });

  it("flags real volume appearing where there was none before, once past the floor", () => {
    expect(isUsageAnomaly(5, [0, 0, 0, 0, 0, 0, 0])).toBe(true);
  });

  it("flags when today is >= 3x the trailing average", () => {
    // avg = 2, today = 6 -> ratio 3
    expect(isUsageAnomaly(6, [2, 2, 2, 2, 2, 2, 2])).toBe(true);
  });

  it("does not flag just under the 3x ratio", () => {
    // avg = 10, today = 29 -> ratio 2.9
    expect(isUsageAnomaly(29, [10, 10, 10, 10, 10, 10, 10])).toBe(false);
  });

  it("does not flag ordinary day-to-day variation", () => {
    expect(isUsageAnomaly(12, [10, 11, 9, 10, 12, 8, 11])).toBe(false);
  });

  it("returns false when there's no prior-day data to compare against", () => {
    expect(isUsageAnomaly(50, [])).toBe(false);
  });
});
