import { describe, it, expect } from "vitest";
import { occurredAtSchema } from "./transaction";

describe("occurredAtSchema", () => {
  it("accepts a 24-hour datetime-local value (no seconds)", () => {
    expect(occurredAtSchema.safeParse("2026-07-27T15:45").success).toBe(true);
  });

  it("accepts a full ISO datetime with seconds", () => {
    expect(occurredAtSchema.safeParse("2026-07-27T15:45:00").success).toBe(true);
  });

  it("tolerates a timezone suffix if one slips through", () => {
    expect(occurredAtSchema.safeParse("2026-07-27T15:45:00+08:00").success).toBe(true);
    expect(occurredAtSchema.safeParse("2026-07-27T15:45:00Z").success).toBe(true);
  });

  it("rejects a 12-hour string with an AM/PM marker", () => {
    // The shape the model emits when it fails to convert — must not be stored.
    expect(occurredAtSchema.safeParse("2026-07-27 3:45 PM").success).toBe(false);
    expect(occurredAtSchema.safeParse("Jul 27, 2026 3:45 PM").success).toBe(false);
  });

  it("rejects an empty or blank string", () => {
    expect(occurredAtSchema.safeParse("").success).toBe(false);
    expect(occurredAtSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects a date with no time", () => {
    expect(occurredAtSchema.safeParse("2026-07-27").success).toBe(false);
  });

  it("rejects a syntactically-shaped but impossible datetime", () => {
    // Matches the regex but Date.parse rejects month 13 / hour 25.
    expect(occurredAtSchema.safeParse("2026-13-01T10:00").success).toBe(false);
    expect(occurredAtSchema.safeParse("2026-07-27T25:00").success).toBe(false);
  });

  it("rejects free-text garbage", () => {
    expect(occurredAtSchema.safeParse("sometime yesterday").success).toBe(false);
  });
});
