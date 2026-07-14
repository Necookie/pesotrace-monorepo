import { describe, it, expect } from "vitest";
import { groupTransactions } from "./grouping";
import type { Database } from "./database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function row(overrides: Partial<Row>): Row {
  return {
    id: crypto.randomUUID(),
    store_id: "store-1",
    direction: "send",
    amount: 100,
    ref_number: "ref",
    counterparty_number: null,
    counterparty_name: null,
    occurred_at: "2026-07-13T00:00:00Z",
    status: "confirmed",
    fee_computed: 20,
    source_type: "screenshot",
    source_file_url: null,
    confidence: 1,
    notes: null,
    tags: [],
    created_by: null,
    created_at: "2026-07-13T00:00:00Z",
    ...overrides,
  };
}

describe("groupTransactions", () => {
  it("groups rows by day and computes net totals (receive minus send)", () => {
    const rows = [
      row({ occurred_at: "2026-07-13T01:58:00Z", direction: "send", amount: 1010 }),
      row({ occurred_at: "2026-07-13T05:00:00Z", direction: "receive", amount: 500 }),
      row({ occurred_at: "2026-07-11T06:02:00Z", direction: "send", amount: 263.99 }),
    ];
    const groups = groupTransactions(rows, "daily");
    expect(groups).toHaveLength(2);
    // Most recent day first.
    expect(groups[0].rows).toHaveLength(2);
    expect(groups[0].netTotal).toBeCloseTo(500 - 1010);
    expect(groups[1].netTotal).toBeCloseTo(-263.99);
  });

  it("groups rows into calendar months", () => {
    const rows = [
      row({ occurred_at: "2026-07-05T00:00:00Z", amount: 100 }),
      row({ occurred_at: "2026-07-20T00:00:00Z", amount: 200 }),
      row({ occurred_at: "2026-06-01T00:00:00Z", amount: 50 }),
    ];
    const groups = groupTransactions(rows, "monthly");
    expect(groups).toHaveLength(2);
    expect(groups[0].rows).toHaveLength(2);
  });
});
