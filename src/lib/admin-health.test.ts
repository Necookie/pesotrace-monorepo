import { describe, it, expect } from "vitest";
import { computeStoreHealth } from "./admin-health";

describe("computeStoreHealth", () => {
  it("returns critical when store is suspended", () => {
    const health = computeStoreHealth({
      balance: 100,
      suspended: true,
    });
    expect(health.status).toBe("critical");
    expect(health.label).toBe("Suspended");
    expect(health.score).toBe(0);
  });

  it("returns critical when credit balance is zero or negative", () => {
    const healthZero = computeStoreHealth({
      balance: 0,
      suspended: false,
    });
    expect(healthZero.status).toBe("critical");
    expect(healthZero.label).toBe("No Credits");

    const healthNeg = computeStoreHealth({
      balance: -5,
      suspended: false,
    });
    expect(healthNeg.status).toBe("critical");
  });

  it("returns critical when failure rate >= 15% with sufficient extractions", () => {
    const health = computeStoreHealth({
      balance: 100,
      failureRatePct: 20,
      extractionsThisMonth: 10,
    });
    expect(health.status).toBe("critical");
    expect(health.label).toBe("High Failures");
  });

  it("returns warning when balance <= 10", () => {
    const health = computeStoreHealth({
      balance: 8,
      failureRatePct: 0,
      extractionsThisMonth: 50,
      lastActivityAt: new Date().toISOString(),
    });
    expect(health.status).toBe("warning");
    expect(health.label).toBe("Low Credits");
  });

  it("returns warning when failure rate >= 5%", () => {
    const health = computeStoreHealth({
      balance: 100,
      failureRatePct: 8.5,
      extractionsThisMonth: 20,
      lastActivityAt: new Date().toISOString(),
    });
    expect(health.status).toBe("warning");
    expect(health.label).toBe("Elevated Failures");
  });

  it("returns inactive when no activity or extractions exist", () => {
    const health = computeStoreHealth({
      balance: 50,
      extractionsThisMonth: 0,
      lastActivityAt: null,
    });
    expect(health.status).toBe("inactive");
    expect(health.label).toBe("Inactive");
  });

  it("returns healthy when store has good balance, low failures, and active extractions", () => {
    const health = computeStoreHealth({
      balance: 500,
      failureRatePct: 0.5,
      extractionsThisMonth: 120,
      lastActivityAt: new Date().toISOString(),
    });
    expect(health.status).toBe("healthy");
    expect(health.label).toBe("Healthy");
    expect(health.score).toBeGreaterThanOrEqual(90);
  });
});
