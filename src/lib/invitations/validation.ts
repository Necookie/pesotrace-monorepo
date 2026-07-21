import type { InvitationStatus } from "@/lib/database.types";

export function isInvitationExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return true;
  return expiry.getTime() <= now.getTime();
}

/** Whether an invitation can still be accepted right now. */
export function isInvitationAcceptable(
  status: InvitationStatus,
  expiresAt: string,
  now: Date = new Date()
): boolean {
  return status === "pending" && !isInvitationExpired(expiresAt, now);
}
