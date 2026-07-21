import { describe, it, expect } from "vitest";
import { getEmailConfigError } from "./config";

describe("getEmailConfigError", () => {
  it("returns null when both env vars are set", () => {
    expect(getEmailConfigError({ RESEND_API_KEY: "re_123", EMAIL_FROM: "hello@example.com" })).toBeNull();
  });

  it("flags a missing EMAIL_FROM before checking the API key", () => {
    expect(getEmailConfigError({ RESEND_API_KEY: "re_123" })).toBe("EMAIL_FROM is not configured");
  });

  it("flags a missing RESEND_API_KEY when EMAIL_FROM is set", () => {
    expect(getEmailConfigError({ EMAIL_FROM: "hello@example.com" })).toBe("RESEND_API_KEY is not configured");
  });

  it("flags EMAIL_FROM first when neither is set", () => {
    expect(getEmailConfigError({})).toBe("EMAIL_FROM is not configured");
  });
});
