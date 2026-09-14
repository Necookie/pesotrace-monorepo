import { describe, expect, it, vi } from "vitest";
import {
  isRetryableSupabaseReadError,
  readSupabaseWithRetry,
  SupabaseReadError,
} from "./read-with-retry";

describe("isRetryableSupabaseReadError", () => {
  it("recognizes timeouts, rate limits, and server failures", () => {
    expect(isRetryableSupabaseReadError({ message: "aborted" }, 0)).toBe(true);
    expect(isRetryableSupabaseReadError({ message: "timeout" }, 408)).toBe(true);
    expect(isRetryableSupabaseReadError({ message: "rate limited" }, 429)).toBe(true);
    expect(isRetryableSupabaseReadError({ message: "gateway timeout" }, 504)).toBe(true);
  });

  it("does not retry permanent query failures", () => {
    expect(isRetryableSupabaseReadError({ message: "bad query" }, 400)).toBe(false);
    expect(isRetryableSupabaseReadError({ message: "forbidden" }, 403)).toBe(false);
  });
});

describe("readSupabaseWithRetry", () => {
  it("retries a 504 response and returns recovered data", async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "upstream timeout" }, status: 504 })
      .mockResolvedValueOnce({ data: { balance: 251 }, error: null, status: 200 });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      readSupabaseWithRetry(read, "load credits", { sleep })
    ).resolves.toEqual({ balance: 251 });
    expect(read).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it("stops immediately for a permanent response error", async () => {
    const error = { message: "column does not exist" };
    const read = vi.fn().mockResolvedValue({ data: null, error, status: 400 });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(readSupabaseWithRetry(read, "load profile", { sleep })).rejects.toMatchObject({
      name: "SupabaseReadError",
      attempts: 1,
      transient: false,
      cause: error,
    });
    expect(read).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("reports a transient failure after the retry limit", async () => {
    const read = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "gateway timeout" },
      status: 504,
    });

    const result = readSupabaseWithRetry(read, "load store", {
      maxAttempts: 2,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    await expect(result).rejects.toBeInstanceOf(SupabaseReadError);
    await expect(result).rejects.toMatchObject({ attempts: 2, transient: true });
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("retries a thrown transport error", async () => {
    const read = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({ data: "ok", error: null, status: 200 });

    await expect(
      readSupabaseWithRetry(read, "load data", {
        sleep: vi.fn().mockResolvedValue(undefined),
      })
    ).resolves.toBe("ok");
    expect(read).toHaveBeenCalledTimes(2);
  });
});
