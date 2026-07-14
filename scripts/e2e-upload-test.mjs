import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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

const session = JSON.parse(fs.readFileSync("/tmp/session.json", "utf8"));

// Authenticated as the real test user via anon key + real session — this
// exercises RLS for real, not a service-role bypass.
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
await supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
});

const { data: userData } = await supabase.auth.getUser();
console.log("Authenticated as:", userData.user?.email);

const { data: profile } = await supabase
  .from("profiles")
  .select("store_id")
  .eq("id", userData.user.id)
  .single();
console.log("store_id:", profile.store_id);

const dir = "C:\\Users\\dheyn\\Downloads\\sample receips";
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).slice(0, 3);

for (const file of files) {
  const bytes = fs.readFileSync(`${dir}\\${file}`);
  const objectPath = `${profile.store_id}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("transaction-sources")
    .upload(objectPath, bytes, { contentType: "image/jpeg" });
  if (uploadError) {
    console.log(`${file}: STORAGE UPLOAD FAILED —`, uploadError.message);
    continue;
  }

  // Re-use the already-validated extraction result format by calling Gemini directly.
  const { GoogleGenAI, Type } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const schema = {
    type: Type.OBJECT,
    properties: {
      direction: { type: Type.STRING, enum: ["send", "receive"] },
      amount: { type: Type.NUMBER },
      ref_number: { type: Type.STRING },
      counterparty_name: { type: Type.STRING },
      counterparty_number: { type: Type.STRING },
      occurred_at: { type: Type.STRING },
      confidence: { type: Type.NUMBER },
    },
    required: ["direction", "amount", "ref_number", "occurred_at", "confidence"],
  };
  const res = await ai.models.generateContent({
    model: "gemini-flash-lite-latest",
    contents: [
      {
        role: "user",
        parts: [
          { text: "Extract the GCash transaction details from this screenshot as JSON." },
          { inlineData: { mimeType: "image/jpeg", data: bytes.toString("base64") } },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  const extracted = JSON.parse(res.text);

  const fee = Math.ceil(extracted.amount / 1000) * 20;
  const status = extracted.confidence < 0.85 ? "needs_review" : "confirmed";

  const { error: insertError } = await supabase.from("transactions").insert({
    store_id: profile.store_id,
    direction: extracted.direction,
    amount: extracted.amount,
    ref_number: extracted.ref_number,
    counterparty_name: extracted.counterparty_name || null,
    counterparty_number: extracted.counterparty_number || null,
    occurred_at: extracted.occurred_at,
    status,
    fee_computed: fee,
    source_type: "screenshot",
    source_file_url: objectPath,
    confidence: extracted.confidence,
    created_by: userData.user.id,
  });

  if (insertError) {
    console.log(`${file}: INSERT FAILED —`, insertError.message);
  } else {
    console.log(
      `${file}: OK — ${extracted.direction} ₱${extracted.amount} ref=${extracted.ref_number} fee=₱${fee} status=${status}`
    );
  }
}

const { data: rows, count } = await supabase
  .from("transactions")
  .select("*", { count: "exact" })
  .eq("store_id", profile.store_id);
console.log(`\nTotal transactions now in store: ${count}`);
