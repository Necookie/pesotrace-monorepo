"use client";

import { posthog } from "@/lib/posthog";

/**
 * Reports a client-side exception to PostHog error tracking. Kept as a thin
 * wrapper so the underlying provider can change without touching call sites,
 * and so error reporting can never itself throw and mask the original error.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  try {
    posthog.captureException(error, context);
  } catch {
    // Swallow — error reporting must never crash the caller.
  }
}
