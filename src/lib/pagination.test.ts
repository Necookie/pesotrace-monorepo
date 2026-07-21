import { describe, it, expect } from "vitest";
import { paginateRows } from "./pagination";

describe("paginateRows", () => {
  it("reports hasMore and trims the extra row when over-fetched", () => {
    const result = paginateRows([1, 2, 3, 4, 5], 4);
    expect(result.hasMore).toBe(true);
    expect(result.rows).toEqual([1, 2, 3, 4]);
  });

  it("reports no more when exactly at the limit", () => {
    const result = paginateRows([1, 2, 3, 4], 4);
    expect(result.hasMore).toBe(false);
    expect(result.rows).toEqual([1, 2, 3, 4]);
  });

  it("reports no more when under the limit", () => {
    const result = paginateRows([1, 2], 4);
    expect(result.hasMore).toBe(false);
    expect(result.rows).toEqual([1, 2]);
  });

  it("handles an empty page", () => {
    const result = paginateRows([], 4);
    expect(result.hasMore).toBe(false);
    expect(result.rows).toEqual([]);
  });

  it("handles a limit of zero without crashing", () => {
    const result = paginateRows([1], 0);
    expect(result.hasMore).toBe(true);
    expect(result.rows).toEqual([]);
  });
});
