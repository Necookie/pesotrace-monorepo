import { describe, it, expect } from "vitest";
import { transactionsToCsv } from "./csv";
import type { Database } from "./database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function makeRow(overrides: Partial<Row>): Row {
  return {
    id: "1",
    store_id: "store-1",
    direction: "receive",
    amount: 100,
    ref_number: "REF0001234",
    counterparty_number: null,
    counterparty_name: null,
    occurred_at: "2026-01-01T12:00:00.000Z",
    status: "confirmed",
    fee_computed: 20,
    source_type: "screenshot",
    source_file_url: null,
    confidence: 1,
    notes: null,
    tags: [],
    category: "cash_in",
    created_by: null,
    created_at: "2026-01-01T12:00:00.000Z",
    ...overrides,
  } as Row;
}

describe("transactionsToCsv", () => {
  it("prefixes a leading-formula counterparty field so spreadsheet apps don't evaluate it", () => {
    const csv = transactionsToCsv([
      makeRow({ counterparty_number: '=HYPERLINK("http://evil.example","click")' }),
    ]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("'=HYPERLINK");
    expect(dataLine).not.toMatch(/,=HYPERLINK/);
  });

  it("leaves ordinary values untouched", () => {
    const csv = transactionsToCsv([makeRow({ counterparty_number: "09171234567" })]);
    expect(csv).toContain("09171234567");
  });
});
