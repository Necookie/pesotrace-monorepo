import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const pdfPath =
  "C:\\Users\\dheyn\\Downloads\\sample receips\\ACFrOgDJ3YSsDVe1GTRbDb9msX_p4PLD5jS_HA2bnAsI6DYYYsIEiMhBBpGWeF5W4Nvgcg_5dvmhwE44bM8hLP6hP4XBTRbfXY_7gAmSvfkqpnvf0lgLq4gQ2KAXRCzAC__vurfW1BXZiBnUyY_jYU9d5ygTgDO5LIe9GLgUXg==.pdf";
const pdfBytes = fs.readFileSync(pdfPath);

const schema = {
  type: Type.OBJECT,
  properties: {
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          occurred_at: { type: Type.STRING, description: "ISO 8601 datetime" },
          description: { type: Type.STRING },
          ref_number: { type: Type.STRING },
          debit: { type: Type.NUMBER },
          credit: { type: Type.NUMBER },
          balance: { type: Type.NUMBER },
          category: { type: Type.STRING, enum: ["cash_in", "cash_out", "load", "bills", "other"] },
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
  "Debit, and Total Credit summary rows). For each row: occurred_at in ISO " +
  "8601. debit is set only if the Debit column has a value (money left the " +
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

const res = await ai.models.generateContent({
  model: "gemini-flash-lite-latest",
  contents: [
    {
      role: "user",
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType: "application/pdf", data: pdfBytes.toString("base64") } },
      ],
    },
  ],
  config: { responseMimeType: "application/json", responseSchema: schema },
});

console.log("usageMetadata:", JSON.stringify(res.usageMetadata));
const parsed = JSON.parse(res.text);
console.log(`\nParsed ${parsed.transactions.length} transactions\n`);
console.log(JSON.stringify(parsed.transactions.slice(0, 5), null, 1));
console.log("...");
console.log(JSON.stringify(parsed.transactions.slice(-5), null, 1));

