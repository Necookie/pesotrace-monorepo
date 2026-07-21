/**
 * Trims a limit+1-row over-fetch down to a page, deriving hasMore from
 * whether that extra row was actually returned — avoids a separate
 * count(*) query. Shared by listTransactions and getStoreCreditDetail.
 */
export function paginateRows<T>(rows: T[], limit: number): { rows: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}
