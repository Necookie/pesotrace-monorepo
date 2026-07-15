/**
 * Per-token pricing for GEMINI_MODEL (gemini-flash-lite-latest -> Gemini 3.1
 * Flash-Lite as of 2026-07). Google has no live pricing endpoint, so these
 * are maintained constants — update alongside GEMINI_MODEL in client.ts if
 * the model changes or pricing shifts.
 */
export const INPUT_COST_PER_MILLION_USD = 0.25;
export const OUTPUT_COST_PER_MILLION_USD = 1.5;

export type UsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type ExtractionCost = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export function computeExtractionCost(usage: UsageMetadata | undefined): ExtractionCost {
  const inputTokens = usage?.promptTokenCount ?? 0;
  const outputTokens = usage?.candidatesTokenCount ?? 0;
  const costUsd =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION_USD +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION_USD;

  return { inputTokens, outputTokens, costUsd };
}
