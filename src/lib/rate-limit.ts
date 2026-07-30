/**
 * In-memory sliding-window rate limiter. Good enough to stop a runaway
 * client from hammering a paid Gemini call in a loop; it is per-instance
 * (resets on redeploy, doesn't share state across serverless instances), so
 * it isn't a substitute for a shared limiter (Upstash/Vercel KV) if this
 * ever needs to hold under multi-instance production traffic.
 */
const hits = new Map<string, number[]>();

/**
 * Prune keys whose entire window has expired so the Map can't grow without
 * bound on a long-running instance. Called every PRUNE_INTERVAL checks — the
 * interval trades thoroughness for overhead; at the default it adds one O(n)
 * sweep every 100 requests across all keys.
 */
const PRUNE_INTERVAL = 100;
let checkCount = 0;

function pruneStaleKeys(windowMs: number): void {
  const now = Date.now();
  for (const [key, timestamps] of hits) {
    if (timestamps.every((t) => now - t >= windowMs)) {
      hits.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();

  checkCount++;
  if (checkCount % PRUNE_INTERVAL === 0) pruneStaleKeys(windowMs);

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return { allowed: false, retryAfterMs: windowMs - (now - timestamps[0]) };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
