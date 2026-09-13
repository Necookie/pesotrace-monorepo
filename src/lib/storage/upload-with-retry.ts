type UploadError = {
  message?: string;
  status?: number;
  statusCode?: string;
};

type UploadAttempt<TError> = {
  error: TError | null;
};

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
};

export type UploadWithRetryResult<TError> =
  | { ok: true; attempts: number }
  | { ok: false; attempts: number; error: TError };

function numericStatus(error: unknown) {
  if (!error || typeof error !== "object") return undefined;

  const { status, statusCode } = error as UploadError;
  if (typeof status === "number") return status;

  if (typeof statusCode === "string" && /^\d{3}$/.test(statusCode)) {
    return Number(statusCode);
  }

  return undefined;
}

export function isRetryableStorageError(error: unknown) {
  const status = numericStatus(error);

  // StorageUnknownError has no status and represents transport failures or
  // malformed gateway responses. Both can be temporary, so give them the
  // same bounded retry treatment as explicit 5xx/timeout responses.
  return status === undefined || status === 408 || status === 429 || status >= 500;
}

export async function uploadWithRetry<TError>(
  upload: () => Promise<UploadAttempt<TError>>,
  {
    maxAttempts = 3,
    baseDelayMs = 150,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  }: RetryOptions = {}
): Promise<UploadWithRetryResult<TError>> {
  const attemptsLimit = Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    const { error } = await upload();

    if (!error) {
      return { ok: true, attempts: attempt };
    }

    if (attempt === attemptsLimit || !isRetryableStorageError(error)) {
      return { ok: false, attempts: attempt, error };
    }

    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  // The loop always returns, but this keeps the function total if its bounds
  // are changed later.
  throw new Error("Storage upload retry loop ended unexpectedly");
}
