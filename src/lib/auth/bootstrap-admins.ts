/**
 * Pure env-var parsing, deliberately kept free of any server-only import so
 * it's unit testable — platform-admin.ts (which pulls in the Supabase admin
 * client) composes this with the DB-backed fallback lookup.
 */
export function parseBootstrapAdminIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isBootstrapAdmin(userId: string, raw: string | undefined): boolean {
  return parseBootstrapAdminIds(raw).includes(userId);
}
