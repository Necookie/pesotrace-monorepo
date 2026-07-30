/**
 * Trims a limit+1-row over-fetch down to a page, deriving hasMore from
 * whether that extra row was actually returned — avoids a separate
 * count(*) query. Shared by listTransactions and getStoreCreditDetail.
 */
export function paginateRows<T>(rows: T[], limit: number): { rows: T[]; hasMore: boolean } {
  // Fast-path: no rows means no slice overhead and definitely no next page.
  if (rows.length === 0) return { rows, hasMore: false };

  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}
