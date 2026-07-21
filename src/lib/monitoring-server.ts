import "server-only";
import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com" });
  }
  return client;
}

/**
 * Reports a server-side exception to PostHog error tracking. Uses the
 * immediate (non-batched) send since serverless route handlers can be frozen
 * or torn down right after the response, giving a batching client no chance
 * to flush. No-ops if PostHog isn't configured; never throws.
 */
export async function captureException(
  error: unknown,
  distinctId = "server",
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const ph = getClient();
    if (!ph) return;
    await ph.captureExceptionImmediate(error, distinctId, properties);
  } catch {
    // Swallow — error reporting must never crash the caller.
  }
}
