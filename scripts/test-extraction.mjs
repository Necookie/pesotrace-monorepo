import fs from "fs";
import path from "path";
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

const schema = {
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
  "ref_number is the GCash reference number. occurred_at should be the " +
  "transaction date/time shown, in ISO 8601 format (assume current year if " +
  "year is not shown). Return confidence 0-1 for how certain you are of the " +
  "extraction based on image clarity and field legibility.";

const dir = "C:\\Users\\dheyn\\Downloads\\sample receips";
const files = fs
  .readdirSync(dir)
  .filter((f) => /\.(jpe?g|png)$/i.test(f));

console.log(`Testing ${files.length} sample receipts...\n`);

for (const file of files) {
  const imgPath = path.join(dir, file);
  const imgB64 = fs.readFileSync(imgPath).toString("base64");
  const mimeType = /\.png$/i.test(file) ? "image/png" : "image/jpeg";

  try {
    const res = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imgB64 } },
          ],
        },
      ],
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    console.log(`=== ${file} ===`);
    console.log(res.text);
    console.log();
  } catch (e) {
    console.log(`=== ${file} === ERROR`);
    console.log(e.message);
    console.log();
  }
}
