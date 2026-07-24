import { describe, it, expect } from "vitest";
import { runFormula, parseFormula, FormulaError, type FormulaContext } from "./fee-formula";

function ctx(overrides: Partial<FormulaContext> = {}): FormulaContext {
  return { amount: 1000, direction: "send", category: "cash_out", ...overrides };
}

describe("fee formula — arithmetic", () => {
  it("evaluates literals and basic operators", () => {
    expect(runFormula("10", ctx())).toBe(10);
    expect(runFormula("2 + 3 * 4", ctx())).toBe(14);
    expect(runFormula("(2 + 3) * 4", ctx())).toBe(20);
    expect(runFormula("10 - 4 - 3", ctx())).toBe(3);
    expect(runFormula("7 % 4", ctx())).toBe(3);
  });

  it("supports underscores in numbers for readability", () => {
    expect(runFormula("1_000 + 500", ctx())).toBe(1500);
  });

  it("applies unary negation", () => {
    expect(runFormula("10 - -5", ctx())).toBe(15);
  });

  it("exposes the whitelisted math helpers", () => {
    expect(runFormula("ceil(1.1)", ctx())).toBe(2);
    expect(runFormula("floor(1.9)", ctx())).toBe(1);
    expect(runFormula("round(1.5)", ctx())).toBe(2);
    expect(runFormula("abs(0 - 7)", ctx())).toBe(7);
    expect(runFormula("min(10, 20)", ctx())).toBe(10);
    expect(runFormula("max(10, 20)", ctx())).toBe(20);
  });
});

describe("fee formula — context variables", () => {
  it("reads amount", () => {
    expect(runFormula("amount * 0.02", ctx({ amount: 5000 }))).toBe(100);
  });

  it("compares direction and category as strings", () => {
    expect(runFormula('direction == "send" ? 20 : 10', ctx({ direction: "send" }))).toBe(20);
    expect(runFormula('direction == "send" ? 20 : 10', ctx({ direction: "receive" }))).toBe(10);
    expect(runFormula('category == "bills" ? 5 : 15', ctx({ category: "bills" }))).toBe(5);
  });

  it("supports boolean combinators with short-circuiting", () => {
    expect(runFormula('amount > 500 && direction == "send" ? 30 : 10', ctx({ amount: 900 }))).toBe(30);
    expect(runFormula('amount > 500 || direction == "receive" ? 30 : 10', ctx({ amount: 100 }))).toBe(10);
  });
});

describe("fee formula — the schedule this feature exists for", () => {
  // ₱10 / ₱15 / ₱20 flat bands, then ₱20 base plus ₱10 per extra ₱500.
  const schedule = `
    amount <= 200  ? 10 :
    amount <= 500  ? 15 :
    amount <= 1000 ? 20 :
    20 + ceil((amount - 1000) / 500) * 10
  `;

  it.each([
    [100, 10],
    [200, 10],
    [201, 15],
    [500, 15],
    [501, 20],
    [1000, 20],
    [1200, 30],
    [1500, 30],
    [1501, 40],
    [2000, 40],
  ])("charges ₱%i → ₱%i", (amount, expected) => {
    expect(runFormula(schedule, ctx({ amount }))).toBe(expected);
  });
});

describe("fee formula — rejected input", () => {
  it("rejects an empty formula", () => {
    expect(() => runFormula("", ctx())).toThrow(FormulaError);
    expect(() => runFormula("   ", ctx())).toThrow(FormulaError);
  });

  it("rejects unknown names rather than treating them as undefined", () => {
    expect(() => runFormula("total * 2", ctx())).toThrow(/Unknown name "total"/);
  });

  it("rejects unknown functions", () => {
    expect(() => runFormula("sqrt(16)", ctx())).toThrow(/Unknown function "sqrt"/);
  });

  it("rejects wrong argument counts", () => {
    expect(() => runFormula("min(1)", ctx())).toThrow(/takes 2 arguments/);
    expect(() => runFormula("ceil(1, 2)", ctx())).toThrow(/takes 1 argument/);
  });

  it("rejects malformed syntax", () => {
    expect(() => runFormula("2 +", ctx())).toThrow(FormulaError);
    expect(() => runFormula("(2 + 3", ctx())).toThrow(FormulaError);
    expect(() => runFormula("2 3", ctx())).toThrow(FormulaError);
    expect(() => runFormula("amount ? 1", ctx())).toThrow(FormulaError);
  });

  it("rejects division by zero instead of returning Infinity", () => {
    expect(() => runFormula("10 / 0", ctx())).toThrow(/Division by zero/);
  });

  it("rejects a negative fee", () => {
    expect(() => runFormula("0 - 5", ctx())).toThrow(/negative fee/);
  });

  it("rejects a non-numeric result", () => {
    expect(() => runFormula('"free"', ctx())).toThrow(/must produce a number/);
    expect(() => runFormula("amount > 5", ctx())).toThrow(/must produce a number/);
  });

  it("rejects a formula longer than the length cap", () => {
    expect(() => runFormula("1 + ".repeat(600) + "1", ctx())).toThrow(/too long/);
  });
});

describe("fee formula — sandbox boundaries", () => {
  // These are the escapes a hostile tenant would actually reach for. Each one
  // must fail at parse or eval time, never touch a host object, and never
  // reach eval/Function — the engine walks an AST and has no such path.
  it.each([
    "constructor",
    "this",
    "globalThis",
    "process",
    "require",
    "window",
    "__proto__",
    "toString",
    "hasOwnProperty",
  ])("refuses to resolve %s as a value", (name) => {
    expect(() => runFormula(name, ctx())).toThrow(FormulaError);
  });

  it.each([
    "constructor('return 1')",
    "eval('1')",
    "Function('return 1')",
    "require('fs')",
    "process.exit()",
    "amount.constructor",
    "({}).toString",
  ])("refuses to run %s", (source) => {
    expect(() => runFormula(source, ctx())).toThrow(FormulaError);
  });

  it("does not inherit prototype members as callable functions", () => {
    // FUNCTIONS is consulted with hasOwnProperty precisely so that inherited
    // Object.prototype keys cannot be invoked.
    expect(() => runFormula("valueOf(1)", ctx())).toThrow(/Unknown function/);
    expect(() => runFormula("hasOwnProperty(1)", ctx())).toThrow(/Unknown function/);
  });
});

describe("parseFormula", () => {
  it("returns a reusable AST so a formula is parsed once, not per transaction", () => {
    const ast = parseFormula("amount <= 500 ? 15 : 20");
    expect(ast.kind).toBe("ternary");
  });

  it("reports the position of a syntax error", () => {
    try {
      parseFormula("10 + @");
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(FormulaError);
      expect((error as FormulaError).position).toBe(5);
    }
  });
});
