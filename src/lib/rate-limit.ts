/**
 * In-memory sliding-window rate limiter. Good enough to stop a runaway
 * client from hammering a paid Gemini call in a loop; it is per-instance
 * (resets on redeploy, doesn't share state across serverless instances), so
 * it isn't a substitute for a shared limiter (Upstash/Vercel KV) if this
 * ever needs to hold under multi-instance production traffic.
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return { allowed: false, retryAfterMs: windowMs - (now - timestamps[0]) };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
