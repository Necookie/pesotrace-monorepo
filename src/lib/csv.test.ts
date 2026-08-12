import { describe, it, expect } from "vitest";
import { escapeCsv, transactionsToCsv } from "./csv";
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

describe("escapeCsv", () => {
  it("neutralizes formula injection characters (=, +, -, @)", () => {
    expect(escapeCsv("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
    expect(escapeCsv("+123456")).toBe("'+123456");
    expect(escapeCsv("-100")).toBe("'-100");
    expect(escapeCsv("@admin")).toBe("'@admin");
  });

  it("escapes quotes, commas, and newlines properly", () => {
    expect(escapeCsv('Hello, "World"')).toBe('"Hello, ""World"""');
    expect(escapeCsv("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
  });

  it("handles null and empty values gracefully", () => {
    expect(escapeCsv(null)).toBe("");
    expect(escapeCsv("")).toBe("");
  });
});

describe("transactionsToCsv", () => {
  it("includes UTF-8 BOM prefix for Excel compatibility", () => {
    const csv = transactionsToCsv([makeRow({})]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("renders correct CSV headers", () => {
    const csv = transactionsToCsv([makeRow({})]);
    const lines = csv.slice(1).split("\n");
    expect(lines[0]).toBe(
      "Date,Time,Reference / CP #,Cash In,Cash Out,Load,Amount,Service Fee,Last 4-Digit Reference #"
    );
  });

  it("prefixes a leading-formula counterparty field so spreadsheet apps don't evaluate it", () => {
    const csv = transactionsToCsv([
      makeRow({ counterparty_number: '=HYPERLINK("http://evil.example","click")' }),
    ]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("'=HYPERLINK");
    expect(dataLine).not.toMatch(/,=HYPERLINK/);
  });

  it("categorizes Cash In, Cash Out, and Load amounts correctly in export columns", () => {
    const rows = [
      makeRow({ id: "1", category: "cash_in", amount: 500, ref_number: "100000000001" }),
      makeRow({ id: "2", category: "cash_out", amount: 1500, ref_number: "100000000002" }),
      makeRow({ id: "3", category: "load", amount: 100, ref_number: "100000000003" }),
    ];
    const csv = transactionsToCsv(rows);
    const lines = csv.slice(1).split("\n");

    expect(lines[1]).toContain(",500,,,500,20,0001");
    expect(lines[2]).toContain(",,1500,,1500,20,0002");
    expect(lines[3]).toContain(",,,100,100,20,0003");
  });

  it("leaves ordinary values untouched", () => {
    const csv = transactionsToCsv([makeRow({ counterparty_number: "09171234567" })]);
    expect(csv).toContain("09171234567");
  });
});
