import { describe, it, expect } from "vitest";
import { getHighlightedChunks } from "./highlight";

describe("getHighlightedChunks", () => {
  it("returns single non-matching chunk when query is empty", () => {
    const chunks = getHighlightedChunks("Hello World", "");
    expect(chunks).toEqual([{ text: "Hello World", isMatch: false }]);
  });

  it("handles whitespace query by returning unmodified chunk", () => {
    const chunks = getHighlightedChunks("Hello World", "   ");
    expect(chunks).toEqual([{ text: "Hello World", isMatch: false }]);
  });

  it("highlights match case-insensitively", () => {
    const chunks = getHighlightedChunks("Payment received from Maria Santos", "maria");
    expect(chunks).toEqual([
      { text: "Payment received from ", isMatch: false },
      { text: "Maria", isMatch: true },
      { text: " Santos", isMatch: false },
    ]);
  });

  it("escapes regex special characters safely", () => {
    const chunks = getHighlightedChunks("Ref [GCASH-123.45] complete", "[GCASH-123.45]");
    expect(chunks).toEqual([
      { text: "Ref ", isMatch: false },
      { text: "[GCASH-123.45]", isMatch: true },
      { text: " complete", isMatch: false },
    ]);
  });

  it("handles multiple occurrences in the same string", () => {
    const chunks = getHighlightedChunks("test and test again", "test");
    expect(chunks).toEqual([
      { text: "test", isMatch: true },
      { text: " and ", isMatch: false },
      { text: "test", isMatch: true },
      { text: " again", isMatch: false },
    ]);
  });
});
