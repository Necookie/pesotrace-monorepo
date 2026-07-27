import "server-only";
import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { statementExtractionSchema, type StatementRow } from "@/lib/schemas/statement";
import { computeExtractionCost, type ExtractionCost } from "@/lib/gemini/pricing";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          occurred_at: {
            type: Type.STRING,
            description: "24-hour local timestamp YYYY-MM-DDTHH:mm:ss, no timezone suffix",
          },
          description: { type: Type.STRING },
          ref_number: { type: Type.STRING },
          debit: { type: Type.NUMBER },
          credit: { type: Type.NUMBER },
          balance: { type: Type.NUMBER },
          category: {
            type: Type.STRING,
            enum: ["cash_in", "cash_out", "load", "bills", "other"],
          },
          counterparty_name: { type: Type.STRING },
          counterparty_number: { type: Type.STRING },
        },
        required: ["occurred_at", "description", "ref_number", "balance", "category"],
      },
    },
  },
  required: ["transactions"],
};

const PROMPT =
  "This is a GCash Transaction History statement export (a table with Date and " +
  "Time, Description, Reference No., Debit, Credit, Balance columns). Parse " +
  "every transaction row (skip the STARTING BALANCE, ENDING BALANCE, Total " +
  "Debit, and Total Credit summary rows). For each row: occurred_at is the " +
  "Date and Time as a 24-hour ISO 8601 local timestamp of the form " +
  "YYYY-MM-DDTHH:mm:ss with NO timezone suffix. GCash prints the time on a " +
  "12-hour clock with AM/PM; convert to 24-hour, writing the wall-clock time " +
  "exactly as printed: 1-11 PM add 12 to the hour (3:45 PM -> 15:45), 12 PM " +
  "(noon) stays 12 (12:30 PM -> 12:30), 12 AM (midnight) becomes 00 (12:15 AM " +
  "-> 00:15), 1-11 AM keep the hour (9:05 AM -> 09:05). " +
  "debit is set only if the Debit column has a value (money left the " +
  "wallet), credit only if the Credit column has a value (money came in) — " +
  "exactly one of debit/credit should be set per row, not both. category " +
  "classifies the transaction for a remittance store's own records: " +
  "'cash_in' when a customer hands over physical cash and the store sends " +
  "GCash to them (peer transfer where the store's wallet is debited to a " +
  "personal number), 'cash_out' when a customer sends GCash to the store's " +
  "wallet and the store gives cash back (peer transfer credited from a " +
  "personal number), 'load' for Buy Load transactions, 'bills' for bills " +
  "payment, and 'other' for merchant payments, app purchases, bank transfers " +
  "to/from GoTyme or Maya, etc. Extract counterparty_name/counterparty_number " +
  "from the description when identifiable (a phone number, bank name, or " +
  "merchant name).";

export type StatementExtractionResult =
  | { ok: true; rows: StatementRow[]; cost: ExtractionCost }
  | { ok: false; error: string; cost: ExtractionCost };

export async function extractStatementFromPdf(
  pdfBytes: Buffer
): Promise<StatementExtractionResult> {
  try {
    const ai = getGeminiClient();
    const res = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: "application/pdf", data: pdfBytes.toString("base64") } },
          ],
        },
      ],
      config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
    });

    const cost = computeExtractionCost(res.usageMetadata);
    const raw = JSON.parse(res.text ?? "{}");
    const parsed = statementExtractionSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: "Gemini response did not match the expected shape.", cost };
    }
    if (parsed.data.transactions.length === 0) {
      return { ok: false, error: "No transactions found in this statement.", cost };
    }

    return { ok: true, rows: parsed.data.transactions, cost };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Statement extraction failed.",
      cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    };
  }
}
