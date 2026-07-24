import { describe, it, expect } from "vitest";
import { validateFormula, PROBE_AMOUNTS } from "./fee-formula-validate";

describe("validateFormula", () => {
  it("accepts the target schedule and returns a probe for every amount", () => {
    const result = validateFormula(`
      amount <= 200  ? 10 :
      amount <= 500  ? 15 :
      amount <= 1000 ? 20 :
      20 + ceil((amount - 1000) / 500) * 10
    `);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.probes).toHaveLength(PROBE_AMOUNTS.length);
    expect(result.probes.find((p) => p.amount === 1500)?.fee).toBe(30);
    expect(result.probes.find((p) => p.amount === 500)?.fee).toBe(15);
  });

  it("accepts a flat fee", () => {
    const result = validateFormula("15");
    expect(result.ok).toBe(true);
  });

  it("reports a syntax error with its position instead of throwing", () => {
    const result = validateFormula("10 +");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ended unexpectedly/);
  });

  it("rejects a formula that only breaks at one probe amount", () => {
    // Fine everywhere except amount === 0, which the probe set covers.
    const result = validateFormula("1000 / amount");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/At ₱0/);
    expect(result.error).toMatch(/Division by zero/);
  });

  it("rejects a formula that goes negative at some amounts", () => {
    const result = validateFormula("amount - 1000");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/negative fee/);
  });

  it("rejects a fee larger than the transaction itself", () => {
    // The classic slip: 2% written as `amount * 2`.
    const result = validateFormula("amount * 2");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/more than the transaction itself/);
  });

  it("still allows a small transaction to carry a proportionally large fee", () => {
    // ₱20 flat on a ₱1 transaction is legitimate and must not trip the check.
    const result = validateFormula("20");
    expect(result.ok).toBe(true);
  });

  it("catches a broken branch hidden behind a direction check", () => {
    const result = validateFormula('direction == "receive" ? 0 - 1 : 20');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/receive/);
  });

  it("catches a broken branch hidden behind a category check", () => {
    const result = validateFormula('category == "bills" ? 10 / 0 : 20');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/bills/);
  });

  it("rejects sandbox escape attempts at validation time", () => {
    expect(validateFormula("require('fs')").ok).toBe(false);
    expect(validateFormula("globalThis").ok).toBe(false);
    expect(validateFormula("constructor('return 1')").ok).toBe(false);
  });
});
