import { describe, it, expect } from "vitest";
import { isInvitationExpired, isInvitationAcceptable } from "./validation";

const NOW = new Date("2026-01-15T12:00:00Z");

describe("isInvitationExpired", () => {
  it("returns false for a future expiry", () => {
    expect(isInvitationExpired("2026-01-16T12:00:00Z", NOW)).toBe(false);
  });

  it("returns true for a past expiry", () => {
    expect(isInvitationExpired("2026-01-14T12:00:00Z", NOW)).toBe(true);
  });

  it("returns true exactly at the expiry instant", () => {
    expect(isInvitationExpired("2026-01-15T12:00:00Z", NOW)).toBe(true);
  });

  it("treats an unparseable date as expired", () => {
    expect(isInvitationExpired("not-a-date", NOW)).toBe(true);
  });
});

describe("isInvitationAcceptable", () => {
  it("accepts a pending, unexpired invitation", () => {
    expect(isInvitationAcceptable("pending", "2026-01-16T12:00:00Z", NOW)).toBe(true);
  });

  it("rejects a pending but expired invitation", () => {
    expect(isInvitationAcceptable("pending", "2026-01-14T12:00:00Z", NOW)).toBe(false);
  });

  it("rejects an already-accepted invitation even if not expired", () => {
    expect(isInvitationAcceptable("accepted", "2026-01-16T12:00:00Z", NOW)).toBe(false);
  });

  it("rejects a revoked invitation", () => {
    expect(isInvitationAcceptable("revoked", "2026-01-16T12:00:00Z", NOW)).toBe(false);
  });
});
