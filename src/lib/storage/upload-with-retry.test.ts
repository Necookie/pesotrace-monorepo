import { describe, expect, it, vi } from "vitest";
import { isRetryableStorageError, uploadWithRetry } from "./upload-with-retry";

describe("isRetryableStorageError", () => {
  it("retries unknown transport errors and transient HTTP failures", () => {
    expect(isRetryableStorageError({ message: "<none>" })).toBe(true);
    expect(isRetryableStorageError({ status: 408 })).toBe(true);
    expect(isRetryableStorageError({ statusCode: "429" })).toBe(true);
    expect(isRetryableStorageError({ status: 503 })).toBe(true);
  });

  it("does not retry permanent client failures", () => {
    expect(isRetryableStorageError({ status: 400 })).toBe(false);
    expect(isRetryableStorageError({ statusCode: "403" })).toBe(false);
  });
});

describe("uploadWithRetry", () => {
  it("returns after a transient failure recovers", async () => {
    const transientError = { message: "<none>" };
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ error: transientError })
      .mockResolvedValueOnce({ error: null });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(uploadWithRetry(upload, { sleep })).resolves.toEqual({
      ok: true,
      attempts: 2,
    });
    expect(upload).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(150);
  });

  it("stops immediately for a permanent failure", async () => {
    const permanentError = { message: "Invalid request", status: 400 };
    const upload = vi.fn().mockResolvedValue({ error: permanentError });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(uploadWithRetry(upload, { sleep })).resolves.toEqual({
      ok: false,
      attempts: 1,
      error: permanentError,
    });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("caps repeated transient failures", async () => {
    const transientError = { message: "fetch failed" };
    const upload = vi.fn().mockResolvedValue({ error: transientError });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      uploadWithRetry(upload, { maxAttempts: 3, baseDelayMs: 10, sleep })
    ).resolves.toEqual({
      ok: false,
      attempts: 3,
      error: transientError,
    });
    expect(upload).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 10);
    expect(sleep).toHaveBeenNthCalledWith(2, 20);
  });
});
