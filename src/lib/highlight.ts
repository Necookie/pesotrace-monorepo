export interface HighlightChunk {
  text: string;
  isMatch: boolean;
}

/**
 * Splits input text into matching and non-matching chunks for highlighting search terms.
 * Case-insensitive, safe for regex special characters.
 */
export function getHighlightedChunks(text: string, query: string): HighlightChunk[] {
  if (!text) return [];
  if (!query || !query.trim()) {
    return [{ text, isMatch: false }];
  }

  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  const parts = text.split(regex);
  const chunks: HighlightChunk[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isMatch = part.toLowerCase() === trimmed.toLowerCase();
    chunks.push({ text: part, isMatch });
  }

  return chunks;
}
