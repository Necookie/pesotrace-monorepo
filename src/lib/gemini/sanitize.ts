/**
 * Pre-validation sanitization for Gemini extraction JSON.
 *
 * Models occasionally return numbers with commas ("1,500.00"), currency prefixes ("PHP 500"),
 * numeric reference numbers (5042814017377 as integer), or 12-hour AM/PM timestamps.
 * Normalizing these before Zod validation recovers valid transactions without failing the upload.
 */
export function sanitizeExtractionPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...raw };

  // 1. Amount: strip currency symbols (PHP, ₱, $) and commas
  if (typeof sanitized.amount === "string") {
    const cleaned = sanitized.amount.replace(/[^0-9.-]+/g, "");
    const parsedNum = Number(cleaned);
    if (!Number.isNaN(parsedNum)) {
      sanitized.amount = parsedNum;
    }
  }

  // 2. Reference number: coerce numbers/integers to string and trim
  if (typeof sanitized.ref_number === "number") {
    sanitized.ref_number = String(sanitized.ref_number);
  } else if (typeof sanitized.ref_number === "string") {
    sanitized.ref_number = sanitized.ref_number.trim();
  }

  // 3. Confidence: fallback to 0.85 if missing/null/out of bounds
  if (sanitized.confidence === null || sanitized.confidence === undefined || typeof sanitized.confidence !== "number") {
    sanitized.confidence = 0.85;
  } else {
    sanitized.confidence = Math.max(0, Math.min(1, sanitized.confidence));
  }

  // 4. Occurred at: normalize 12-hour AM/PM timestamps to 24-hour ISO format
  if (typeof sanitized.occurred_at === "string") {
    let dt = sanitized.occurred_at.trim();
    const ampmMatch = dt.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (ampmMatch) {
      const [, datePart, hStr, mStr, sStr, ampm] = ampmMatch;
      let hour = parseInt(hStr, 10);
      const isPm = ampm.toUpperCase() === "PM";
      if (isPm && hour < 12) hour += 12;
      if (!isPm && hour === 12) hour = 0;
      const sec = sStr ?? "00";
      dt = `${datePart}T${String(hour).padStart(2, "0")}:${mStr}:${sec}`;
    }
    sanitized.occurred_at = dt;
  }

  return sanitized;
}
