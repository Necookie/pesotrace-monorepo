const ANOMALY_RATIO_THRESHOLD = 3;
const ANOMALY_MIN_REQUESTS = 5;

/**
 * True when today's request count is a significant spike over the trailing
 * average of the given prior days — a shared/abused API key looks like this
 * just as often as a great sales day does, so it's a "look at this" flag,
 * not an accusation. Below ANOMALY_MIN_REQUESTS never flags, so a store
 * going from 0 to 1 requests doesn't read as an infinite spike.
 */
export function isUsageAnomaly(requestsToday: number, priorDayCounts: number[]): boolean {
  if (requestsToday < ANOMALY_MIN_REQUESTS) return false;
  if (priorDayCounts.length === 0) return false;

  const avg = priorDayCounts.reduce((sum, c) => sum + c, 0) / priorDayCounts.length;
  if (avg === 0) return true;

  return requestsToday / avg >= ANOMALY_RATIO_THRESHOLD;
}
