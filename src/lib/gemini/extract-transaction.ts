import "server-only";
import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { extractedTransactionSchema, type ExtractedTransaction } from "@/lib/schemas/transaction";
import { computeExtractionCost, type ExtractionCost } from "@/lib/gemini/pricing";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    direction: { type: Type.STRING, enum: ["send", "receive"] },
    amount: { type: Type.NUMBER },
    ref_number: { type: Type.STRING },
    counterparty_name: { type: Type.STRING },
    counterparty_number: { type: Type.STRING },
    occurred_at: { type: Type.STRING, description: "ISO 8601 datetime" },
    confidence: { type: Type.NUMBER, description: "0 to 1" },
  },
  required: ["direction", "amount", "ref_number", "occurred_at", "confidence"],
};

const PROMPT =
  "Extract the GCash transaction details from this screenshot. direction is " +
  "'send' if money left the user's wallet, 'receive' if it came in. " +
  "ref_number is the GCash reference number shown on the receipt. " +
  "occurred_at should be the transaction date/time shown, in ISO 8601 " +
  "format (assume the current year if no year is shown). counterparty_name " +
  "and counterparty_number are the other party's name and/or mobile number " +
  "if shown. Return confidence 0-1 reflecting how certain you are of the " +
  "extraction based on image clarity and field legibility — use a lower " +
  "value if any field is blurry, cropped, or ambiguous.";

export type ExtractionResult =
  | { ok: true; data: ExtractedTransaction; cost: ExtractionCost }
  | { ok: false; error: string; cost: ExtractionCost };

export async function extractTransactionFromImage(
  imageBytes: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  try {
    const ai = getGeminiClient();
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imageBytes.toString("base64") } },
          ],
        },
      ],
      config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
    });

    const cost = computeExtractionCost(res.usageMetadata);
    const raw = JSON.parse(res.text ?? "{}");
    const parsed = extractedTransactionSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: "Gemini response did not match the expected shape.", cost };
    }

    return { ok: true, data: parsed.data, cost };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Extraction failed.",
      cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    };
  }
}
