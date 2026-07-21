import { describe, it, expect } from "vitest";
import { parseBootstrapAdminIds, isBootstrapAdmin } from "./bootstrap-admins";

describe("parseBootstrapAdminIds", () => {
  it("splits a comma-separated list and trims whitespace", () => {
    expect(parseBootstrapAdminIds("user_1, user_2 ,user_3")).toEqual(["user_1", "user_2", "user_3"]);
  });

  it("drops empty entries from stray commas", () => {
    expect(parseBootstrapAdminIds("user_1,,user_2,")).toEqual(["user_1", "user_2"]);
  });

  it("returns an empty array for undefined or blank input", () => {
    expect(parseBootstrapAdminIds(undefined)).toEqual([]);
    expect(parseBootstrapAdminIds("")).toEqual([]);
    expect(parseBootstrapAdminIds("   ")).toEqual([]);
  });
});

describe("isBootstrapAdmin", () => {
  it("matches a user id present in the list", () => {
    expect(isBootstrapAdmin("user_2", "user_1,user_2,user_3")).toBe(true);
  });

  it("does not match a user id absent from the list", () => {
    expect(isBootstrapAdmin("user_9", "user_1,user_2,user_3")).toBe(false);
  });

  it("does not match anything when the env var is unset", () => {
    expect(isBootstrapAdmin("user_1", undefined)).toBe(false);
  });
});
