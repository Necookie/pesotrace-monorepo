import { describe, it, expect } from "vitest";
import { formatAdminAction, ADMIN_ACTION_CONFIG } from "./admin-audit-format";
import type { AdminActionType } from "./database.types";

describe("formatAdminAction", () => {
  it("formats adjust_credit correctly", () => {
    const res = formatAdminAction("adjust_credit");
    expect(res.label).toBe("Adjusted credits");
    expect(res.category).toBe("credits");
    expect(res.badgeClass).toContain("bg-primary/10");
  });

  it("formats suspend_store and delete_store as store category with destructive styling", () => {
    const suspend = formatAdminAction("suspend_store");
    expect(suspend.category).toBe("store");
    expect(suspend.badgeClass).toContain("rose");

    const del = formatAdminAction("delete_store");
    expect(del.category).toBe("store");
    expect(del.badgeClass).toContain("rose");
  });

  it("formats security actions like grant_admin and revoke_admin", () => {
    const grant = formatAdminAction("grant_admin");
    expect(grant.category).toBe("security");
    expect(grant.badgeClass).toContain("indigo");

    const revoke = formatAdminAction("revoke_admin");
    expect(revoke.category).toBe("security");
  });

  it("provides fallback formatting for unmapped action types", () => {
    const fallback = formatAdminAction("custom_action_test" as unknown as AdminActionType);
    expect(fallback.label).toBe("custom action test");
    expect(fallback.category).toBe("config");
  });
});
