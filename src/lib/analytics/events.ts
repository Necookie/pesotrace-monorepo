"use client";

import { posthog } from "@/lib/posthog";

/**
 * Typed client-side event catalog — one named seam instead of ad-hoc string
 * literals scattered across components, so a typo doesn't silently create a
 * new untracked event name in PostHog.
 */
export const ClientEvent = {
  UploadStarted: "upload_started",
  ExtractionSucceeded: "extraction_succeeded",
  ExtractionFailedShown: "extraction_failed_shown",
  TransactionConfirmed: "transaction_confirmed",
  TrialCreditsRequested: "trial_credits_requested",
  LedgerExported: "ledger_exported",
} as const;

export type ClientEventName = (typeof ClientEvent)[keyof typeof ClientEvent];

export function trackEvent(event: ClientEventName, properties?: Record<string, unknown>): void {
  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never crash the caller.
  }
}
