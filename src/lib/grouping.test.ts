import { describe, it, expect } from "vitest";
import { groupTransactions } from "./grouping";
import type { Database } from "./database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function row(overrides: Partial<Row>): Row {
  return {
    id: crypto.randomUUID(),
    store_id: "store-1",
    direction: "send",
    category: "other",
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

  // occurred_at is a wall-clock time stored under a UTC label, so grouping
  // must read it in UTC. These pin down the times that a host-local
  // implementation would regroup/relabel onto the wrong day on a Manila box.
  it("keeps an evening transaction on its own wall-clock day and label", () => {
    // 7:00 PM Jul 27 as stored. A local Manila interpretation (19:00 -> 03:00
    // next day) would push it to Jul 28.
    const groups = groupTransactions([row({ occurred_at: "2026-07-27T19:00:00Z" })], "daily");
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("2026-07-27");
    expect(groups[0].label).toBe("Jul 27, 2026");
  });

  it("groups a late-evening transaction into the correct month", () => {
    // 11:30 PM on the last day of July, stored wall-clock. Must be July, not
    // August (which a +8h local shift would produce).
    const groups = groupTransactions([row({ occurred_at: "2026-07-31T23:30:00Z" })], "monthly");
    expect(groups[0].key).toBe("2026-07");
    expect(groups[0].label).toBe("July 2026");
  });
});
