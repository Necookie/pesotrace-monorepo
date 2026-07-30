/**
 * A deliberately tiny expression language for custom fee rules.
 *
 * This exists so technical store owners can express schedules the tier table
 * cannot — most importantly "₱20 for the first ₱1,000, then ₱10 per extra
 * ₱500", which needs arithmetic rather than a lookup.
 *
 * It is NOT a scripting language and must never become one. There are no
 * loops, no assignment, no function definitions, no property access, no
 * strings-as-code, and no way to reference anything the evaluator does not
 * explicitly hand it. Input is parsed to an AST and walked; nothing is ever
 * passed to eval/Function. That is what makes it safe to accept from a
 * tenant in a multi-tenant app — there is no host to escape to.
 *
 * Grammar (lowest to highest precedence):
 *   ternary    := or ("?" ternary ":" ternary)?
 *   or         := and ("||" and)*
 *   and        := equality ("&&" equality)*
 *   equality   := comparison (("==" | "!=") comparison)*
 *   comparison := additive (("<" | "<=" | ">" | ">=") additive)*
 *   additive   := multiplicative (("+" | "-") multiplicative)*
 *   multiplicative := unary (("*" | "/" | "%") unary)*
 *   unary      := ("-" | "!") unary | primary
 *   primary    := number | string | identifier | call | "(" ternary ")"
 */

export class FormulaError extends Error {
  constructor(message: string, readonly position?: number) {
    super(message);
    this.name = "FormulaError";
  }
}

// ---------------------------------------------------------------- tokenizer

type TokenType = "number" | "string" | "ident" | "op" | "eof";

type Token = { type: TokenType; value: string; pos: number };

/**
 * Two-tier operator lookup for O(1) token recognition.
 *
 * The old OPERATORS.find() scanned up to 19 entries on every operator
 * character. Splitting into a 2-char Set and a 1-char Set means most tokens
 * hit the fast path in two hash lookups instead of a linear scan — relevant
 * when validating formulas in bulk (the probe set exercises every
 * direction/category combination across 15 amounts).
 */
const TWO_CHAR_OPS = new Set(["<=", ">=", "==", "!=", "&&", "||"]);
const ONE_CHAR_OPS = new Set(["+", "-", "*", "/", "%", "(", ")", ",", "?", ":", "!", "<", ">"]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const char = source[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let j = i;
      while (j < source.length && /[0-9._]/.test(source[j])) j++;
      // Underscores let people write 1_000 for readability, as in the amounts
      // they are actually reasoning about.
      const raw = source.slice(i, j).replace(/_/g, "");
      if (!/^\d*\.?\d+$/.test(raw)) {
        throw new FormulaError(`Invalid number "${source.slice(i, j)}"`, i);
      }
      tokens.push({ type: "number", value: raw, pos: i });
      i = j;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let j = i + 1;
      while (j < source.length && source[j] !== quote) j++;
      if (j >= source.length) {
        throw new FormulaError("Unclosed quote", i);
      }
      tokens.push({ type: "string", value: source.slice(i + 1, j), pos: i });
      i = j + 1;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < source.length && /[a-zA-Z0-9_]/.test(source[j])) j++;
      tokens.push({ type: "ident", value: source.slice(i, j), pos: i });
      i = j;
      continue;
    }

    // Two-tier O(1) operator lookup: try the 2-char slice first, then the
    // single char. This replaces the former linear OPERATORS.find() scan.
    const twoChar = source.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(twoChar)) {
      tokens.push({ type: "op", value: twoChar, pos: i });
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(char)) {
      tokens.push({ type: "op", value: char, pos: i });
      i += 1;
      continue;
    }

    throw new FormulaError(`Unexpected character "${char}"`, i);
  }

  tokens.push({ type: "eof", value: "", pos: source.length });
  return tokens;
}

// ------------------------------------------------------------------- parser

export type Node =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "var"; name: string }
  | { kind: "unary"; op: string; operand: Node }
  | { kind: "binary"; op: string; left: Node; right: Node }
  | { kind: "ternary"; test: Node; then: Node; otherwise: Node }
  | { kind: "call"; name: string; args: Node[] };

const BINARY_PRECEDENCE: Record<string, number> = {
  "||": 1,
  "&&": 2,
  "==": 3,
  "!=": 3,
  "<": 4,
  "<=": 4,
  ">": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.index];
  }

  private next(): Token {
    return this.tokens[this.index++];
  }

  private expectOp(op: string) {
    const token = this.peek();
    if (token.type !== "op" || token.value !== op) {
      throw new FormulaError(`Expected "${op}"`, token.pos);
    }
    this.index++;
  }

  parse(): Node {
    const node = this.parseTernary();
    const token = this.peek();
    if (token.type !== "eof") {
      throw new FormulaError(`Unexpected "${token.value}"`, token.pos);
    }
    return node;
  }

  private parseTernary(): Node {
    const test = this.parseBinary(0);
    const token = this.peek();
    if (token.type === "op" && token.value === "?") {
      this.index++;
      const then = this.parseTernary();
      this.expectOp(":");
      const otherwise = this.parseTernary();
      return { kind: "ternary", test, then, otherwise };
    }
    return test;
  }

  private parseBinary(minPrecedence: number): Node {
    let left = this.parseUnary();

    for (;;) {
      const token = this.peek();
      if (token.type !== "op") break;
      const precedence = BINARY_PRECEDENCE[token.value];
      if (precedence === undefined || precedence < minPrecedence) break;
      this.index++;
      const right = this.parseBinary(precedence + 1);
      left = { kind: "binary", op: token.value, left, right };
    }

    return left;
  }

  private parseUnary(): Node {
    const token = this.peek();
    if (token.type === "op" && (token.value === "-" || token.value === "!")) {
      this.index++;
      return { kind: "unary", op: token.value, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const token = this.next();

    if (token.type === "number") {
      return { kind: "number", value: Number(token.value) };
    }

    if (token.type === "string") {
      return { kind: "string", value: token.value };
    }

    if (token.type === "ident") {
      const after = this.peek();
      if (after.type === "op" && after.value === "(") {
        this.index++;
        const args: Node[] = [];
        if (!(this.peek().type === "op" && this.peek().value === ")")) {
          for (;;) {
            args.push(this.parseTernary());
            const separator = this.peek();
            if (separator.type === "op" && separator.value === ",") {
              this.index++;
              continue;
            }
            break;
          }
        }
        this.expectOp(")");
        return { kind: "call", name: token.value, args };
      }
      return { kind: "var", name: token.value };
    }

    if (token.type === "op" && token.value === "(") {
      const node = this.parseTernary();
      this.expectOp(")");
      return node;
    }

    throw new FormulaError(
      token.type === "eof" ? "Formula ended unexpectedly" : `Unexpected "${token.value}"`,
      token.pos
    );
  }
}

export function parseFormula(source: string): Node {
  if (source.trim() === "") {
    throw new FormulaError("Formula is empty");
  }
  if (source.length > 2000) {
    throw new FormulaError("Formula is too long (max 2000 characters)");
  }
  return new Parser(tokenize(source)).parse();
}

// ---------------------------------------------------------------- evaluator

/** Everything a formula is allowed to call. Nothing else is reachable. */
const FUNCTIONS: Record<string, { arity: number; fn: (...args: number[]) => number }> = {
  min: { arity: 2, fn: (a, b) => Math.min(a, b) },
  max: { arity: 2, fn: (a, b) => Math.max(a, b) },
  ceil: { arity: 1, fn: (a) => Math.ceil(a) },
  floor: { arity: 1, fn: (a) => Math.floor(a) },
  round: { arity: 1, fn: (a) => Math.round(a) },
  abs: { arity: 1, fn: (a) => Math.abs(a) },
};

export type FormulaContext = {
  amount: number;
  direction: string;
  category: string;
};

type Value = number | string | boolean;

function toNumber(value: Value, what: string): number {
  if (typeof value !== "number") {
    throw new FormulaError(`${what} expects a number, got ${typeof value}`);
  }
  return value;
}

function truthy(value: Value): boolean {
  return typeof value === "boolean" ? value : Boolean(value);
}

function evaluateNode(node: Node, context: FormulaContext): Value {
  switch (node.kind) {
    case "number":
      return node.value;

    case "string":
      return node.value;

    case "var": {
      if (node.name in context) {
        return context[node.name as keyof FormulaContext];
      }
      // Bare words are almost always a typo'd variable or an attempt at a
      // string without quotes; naming the valid set beats a generic error.
      throw new FormulaError(
        `Unknown name "${node.name}". Available: amount, direction, category`
      );
    }

    case "unary": {
      const operand = evaluateNode(node.operand, context);
      if (node.op === "-") return -toNumber(operand, "Negation");
      return !truthy(operand);
    }

    case "ternary":
      return truthy(evaluateNode(node.test, context))
        ? evaluateNode(node.then, context)
        : evaluateNode(node.otherwise, context);

    case "binary": {
      // Short-circuit before evaluating the right side, so `a && b` behaves
      // the way anyone writing it would expect.
      if (node.op === "&&") {
        const left = evaluateNode(node.left, context);
        return truthy(left) ? truthy(evaluateNode(node.right, context)) : false;
      }
      if (node.op === "||") {
        const left = evaluateNode(node.left, context);
        return truthy(left) ? true : truthy(evaluateNode(node.right, context));
      }

      const left = evaluateNode(node.left, context);
      const right = evaluateNode(node.right, context);

      switch (node.op) {
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        case "<":
          return toNumber(left, "<") < toNumber(right, "<");
        case "<=":
          return toNumber(left, "<=") <= toNumber(right, "<=");
        case ">":
          return toNumber(left, ">") > toNumber(right, ">");
        case ">=":
          return toNumber(left, ">=") >= toNumber(right, ">=");
        case "+":
          return toNumber(left, "+") + toNumber(right, "+");
        case "-":
          return toNumber(left, "-") - toNumber(right, "-");
        case "*":
          return toNumber(left, "*") * toNumber(right, "*");
        case "/": {
          const divisor = toNumber(right, "/");
          if (divisor === 0) throw new FormulaError("Division by zero");
          return toNumber(left, "/") / divisor;
        }
        case "%": {
          const divisor = toNumber(right, "%");
          if (divisor === 0) throw new FormulaError("Division by zero");
          return toNumber(left, "%") % divisor;
        }
        default:
          throw new FormulaError(`Unsupported operator "${node.op}"`);
      }
    }

    case "call": {
      const target = Object.prototype.hasOwnProperty.call(FUNCTIONS, node.name)
        ? FUNCTIONS[node.name]
        : undefined;
      if (!target) {
        throw new FormulaError(
          `Unknown function "${node.name}". Available: ${Object.keys(FUNCTIONS).join(", ")}`
        );
      }
      if (node.args.length !== target.arity) {
        throw new FormulaError(
          `${node.name}() takes ${target.arity} argument${target.arity === 1 ? "" : "s"}, got ${node.args.length}`
        );
      }
      const args = node.args.map((arg, i) =>
        toNumber(evaluateNode(arg, context), `${node.name}() argument ${i + 1}`)
      );
      return target.fn(...args);
    }
  }
}

/**
 * Evaluates a parsed formula to a fee. Throws FormulaError on anything the
 * caller should not bill: a non-numeric result, NaN, Infinity, or a negative
 * fee. Callers are expected to catch and fall back rather than charge it.
 */
export function evaluateFormula(node: Node, context: FormulaContext): number {
  const result = evaluateNode(node, context);

  if (typeof result !== "number") {
    throw new FormulaError(`Formula must produce a number, got ${typeof result}`);
  }
  if (!Number.isFinite(result)) {
    throw new FormulaError("Formula produced a non-finite number");
  }
  if (result < 0) {
    throw new FormulaError("Formula produced a negative fee");
  }

  return result;
}

/** Convenience for one-shot use — parse and evaluate in a single call. */
export function runFormula(source: string, context: FormulaContext): number {
  return evaluateFormula(parseFormula(source), context);
}
