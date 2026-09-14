type SupabaseReadAttempt<T> = {
  data: T;
  error: unknown;
  status?: number;
};

type SupabaseReadRetryOptions = {
  maxAttempts?: number;
  timeoutMs?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

type ErrorWithStatus = {
  status?: number;
  statusCode?: number | string;
};

export class SupabaseReadError extends Error {
  readonly operation: string;
  readonly attempts: number;
  readonly transient: boolean;
  readonly cause: unknown;

  constructor(operation: string, attempts: number, transient: boolean, cause: unknown) {
    super(`Supabase read failed during ${operation}`);
    this.name = "SupabaseReadError";
    this.operation = operation;
    this.attempts = attempts;
    this.transient = transient;
    this.cause = cause;
  }
}

function numericStatus(error: unknown, responseStatus?: number) {
  if (typeof responseStatus === "number") return responseStatus;
  if (!error || typeof error !== "object") return undefined;

  const { status, statusCode } = error as ErrorWithStatus;
  if (typeof status === "number") return status;
  if (typeof statusCode === "number") return statusCode;
  if (typeof statusCode === "string" && /^\d{3}$/.test(statusCode)) {
    return Number(statusCode);
  }

  return undefined;
}

export function isRetryableSupabaseReadError(error: unknown, responseStatus?: number) {
  const status = numericStatus(error, responseStatus);

  // A status of 0 is how postgrest-js represents an aborted request or a
  // transport failure. Unknown thrown errors are also treated as transient;
  // reads are idempotent, and the retry count is strictly bounded.
  return status === undefined || status === 0 || status === 408 || status === 429 || status >= 500;
}

export async function readSupabaseWithRetry<T>(
  operation: (signal: AbortSignal) => PromiseLike<SupabaseReadAttempt<T>>,
  operationName: string,
  {
    maxAttempts = 2,
    timeoutMs = 5_000,
    baseDelayMs = 200,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  }: SupabaseReadRetryOptions = {}
): Promise<T> {
  const attemptsLimit = Math.max(1, maxAttempts);
  let lastError: unknown;
  let lastWasTransient = true;

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

    try {
      const result = await operation(controller.signal);

      if (!result.error) {
        return result.data;
      }

      lastError = result.error;
      lastWasTransient = isRetryableSupabaseReadError(result.error, result.status);
    } catch (error) {
      lastError = error;
      lastWasTransient = isRetryableSupabaseReadError(error);
    } finally {
      clearTimeout(timeout);
    }

    if (!lastWasTransient || attempt === attemptsLimit) {
      throw new SupabaseReadError(operationName, attempt, lastWasTransient, lastError);
    }

    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  throw new SupabaseReadError(operationName, attemptsLimit, lastWasTransient, lastError);
}
