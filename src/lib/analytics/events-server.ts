import "server-only";
import { captureServerEvent } from "@/lib/monitoring-server";

/** Server-side counterpart to src/lib/analytics/events.ts's client catalog. */
export const ServerEvent = {
  InviteSent: "invite_sent",
  InviteAccepted: "invite_accepted",
  TrialRequestCreated: "trial_request_created",
  TrialRequestApproved: "trial_request_approved",
  StoreDeleted: "store_deleted",
} as const;

export type ServerEventName = (typeof ServerEvent)[keyof typeof ServerEvent];

export async function trackServerEvent(
  event: ServerEventName,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await captureServerEvent(event, distinctId, properties);
}
