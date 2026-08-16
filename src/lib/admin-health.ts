export type StoreHealthStatus = "healthy" | "warning" | "critical" | "inactive";

export interface StoreHealthInput {
  balance: number;
  suspended?: boolean;
  failureRatePct?: number;
  lastActivityAt?: string | null;
  extractionsThisMonth?: number;
}

export interface StoreHealthResult {
  status: StoreHealthStatus;
  label: string;
  reason: string;
  score: number; // 0 - 100
}

/**
 * Computes a standardized Store Health Score and status level.
 * Evaluates:
 * 1. Account suspension (immediately critical / 0)
 * 2. Credit balance adequacy (<=0 is critical, <=10 is warning)
 * 3. Extraction failure rate (>=15% is critical, >=5% is warning)
 * 4. Inactivity recency (>45 days with 0 monthly extractions is inactive)
 */
export function computeStoreHealth(store: StoreHealthInput): StoreHealthResult {
  if (store.suspended) {
    return {
      status: "critical",
      label: "Suspended",
      reason: "Store is administratively suspended",
      score: 0,
    };
  }

  const balance = store.balance ?? 0;
  const failureRate = store.failureRatePct ?? 0;
  const extractions = store.extractionsThisMonth ?? 0;

  // Check critical balance
  if (balance <= 0) {
    return {
      status: "critical",
      label: "No Credits",
      reason: "Credit balance depleted (0 remaining)",
      score: 15,
    };
  }

  // Check critical failure rate
  if (failureRate >= 15 && extractions >= 5) {
    return {
      status: "critical",
      label: "High Failures",
      reason: `Extraction failure rate is critical (${failureRate.toFixed(1)}%)`,
      score: 25,
    };
  }

  // Check warning states
  if (balance <= 10) {
    return {
      status: "warning",
      label: "Low Credits",
      reason: `Low credit balance (${balance} remaining)`,
      score: 50,
    };
  }

  if (failureRate >= 5 && extractions >= 5) {
    return {
      status: "warning",
      label: "Elevated Failures",
      reason: `Extraction failure rate elevated (${failureRate.toFixed(1)}%)`,
      score: 60,
    };
  }

  // Check inactive status
  if (!store.lastActivityAt && extractions === 0) {
    return {
      status: "inactive",
      label: "Inactive",
      reason: "No recent extractions or activity",
      score: 70,
    };
  }

  if (store.lastActivityAt) {
    const daysSinceActivity = (Date.now() - new Date(store.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 45 && extractions === 0) {
      return {
        status: "inactive",
        label: "Dormant",
        reason: `No activity in ${Math.floor(daysSinceActivity)} days`,
        score: 70,
      };
    }
  }

  return {
    status: "healthy",
    label: "Healthy",
    reason: "Normal operations and healthy credit balance",
    score: 95,
  };
}
