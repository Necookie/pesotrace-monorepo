import "server-only";
import { GoogleGenAI } from "@google/genai";

/**
 * Model pinned to the "-latest" alias rather than a dated snapshot
 * (e.g. gemini-2.5-flash-lite) because Google retires dated model IDs for
 * new API keys/projects fairly quickly — verified 2.5-flash-lite already
 * 404s on this project's key. The "-latest" alias tracks whatever the
 * current cheap flash-lite tier is.
 */
export const GEMINI_MODEL = "gemini-flash-lite-latest";

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}
