/**
 * Converts a Gemini extraction's real USD cost (from gemini/pricing.ts) into
 * the credit units shown to store owners. Calibrated so a typical single
 * image extraction (~1087 input / ~111 output tokens, observed in
 * gemini/pricing.test.ts) costs 1 credit — statement extraction, which
 * sends a whole multi-page PDF and returns many rows, costs proportionally
 * more when it actually does.
 */
export const USD_PER_CREDIT = 0.0005;

export function creditsForExtraction(costUsd: number): number {
  if (costUsd <= 0) return 0;
  return Math.max(1, Math.ceil(costUsd / USD_PER_CREDIT));
}
