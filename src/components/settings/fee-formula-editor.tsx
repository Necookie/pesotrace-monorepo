"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { validateFormula } from "@/lib/fee-formula-validate";
import { runFormula } from "@/lib/fee-formula";
import { updateFeeFormula } from "@/app/(app)/settings/actions";

const EXAMPLE = `amount <= 200  ? 10 :
amount <= 500  ? 15 :
amount <= 1000 ? 20 :
20 + ceil((amount - 1000) / 500) * 10`;

const DEFAULT_TEST_AMOUNTS = [200, 500, 1000, 1500, 2000];

export function FeeFormulaEditor({ initial }: { initial: string | null }) {
  const [formula, setFormula] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [testAmount, setTestAmount] = useState("1500");

  const trimmed = formula.trim();

  // Runs on every keystroke. The engine is a pure AST walk over a tiny
  // grammar, so this is far cheaper than a round trip and lets the owner see
  // a syntax error the moment they make it.
  const validation = useMemo(
    () => (trimmed === "" ? null : validateFormula(trimmed)),
    [trimmed]
  );

  const previewRows = useMemo(() => {
    if (!validation?.ok) return [];
    const amounts = [...new Set([...DEFAULT_TEST_AMOUNTS, Number(testAmount) || 0])].sort(
      (a, b) => a - b
    );
    return amounts.map((amount) => {
      try {
        return {
          amount,
          fee: runFormula(trimmed, { amount, direction: "send", category: "cash_out" }),
          error: null as string | null,
        };
      } catch (error) {
        return { amount, fee: null, error: (error as Error).message };
      }
    });
  }, [validation, trimmed, testAmount]);

  async function handleSave() {
    setSaving(true);
    const result = await updateFeeFormula(trimmed === "" ? null : trimmed);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(trimmed === "" ? "Fee formula cleared — tiers apply again" : "Fee formula saved");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-ink">Advanced: fee formula</h2>
        <span className="rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium text-muted">
          Optional
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        For schedules the tier table can&apos;t express — like &ldquo;₱20 for the first ₱1,000,
        then ₱10 per extra ₱500.&rdquo; When set, this <strong>overrides your fee tiers</strong>.
        Leave it blank to go back to using them.
      </p>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="fee-formula">Formula</Label>
        <textarea
          id="fee-formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          rows={5}
          spellCheck={false}
          placeholder={EXAMPLE}
          className="w-full rounded-xl border border-hairline bg-canvas p-3 font-mono text-sm text-ink outline-none placeholder:text-muted-soft focus:border-primary"
        />
      </div>

      {validation && !validation.ok && (
        <p className="mt-2 rounded-xl bg-down/5 px-3 py-2 text-xs text-down">{validation.error}</p>
      )}
      {validation?.ok && (
        <p className="mt-2 text-xs text-up">Formula is valid.</p>
      )}

      {validation?.ok && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="fee-test-amount" className="text-xs text-muted">
                Test an amount (₱)
              </Label>
              <Input
                id="fee-test-amount"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-36"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-hairline">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Fee charged</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.amount}
                    className={cn(
                      "border-b border-hairline last:border-0",
                      String(row.amount) === testAmount && "bg-surface-soft"
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-ink">{formatPeso(row.amount)}</td>
                    <td className="px-3 py-2 text-right font-mono text-ink">
                      {row.error ? (
                        <span className="text-down">{row.error}</span>
                      ) : (
                        formatPeso(row.fee ?? 0)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-body">
          What can I write in here?
        </summary>
        <div className="mt-2 space-y-2 text-xs text-muted">
          <p>
            <strong className="text-body">Values:</strong>{" "}
            <code className="font-mono">amount</code>,{" "}
            <code className="font-mono">direction</code> (
            <code className="font-mono">&quot;send&quot;</code> or{" "}
            <code className="font-mono">&quot;receive&quot;</code>),{" "}
            <code className="font-mono">category</code> (
            <code className="font-mono">&quot;cash_in&quot;</code>,{" "}
            <code className="font-mono">&quot;cash_out&quot;</code>,{" "}
            <code className="font-mono">&quot;load&quot;</code>,{" "}
            <code className="font-mono">&quot;bills&quot;</code>,{" "}
            <code className="font-mono">&quot;other&quot;</code>).
          </p>
          <p>
            <strong className="text-body">Math:</strong>{" "}
            <code className="font-mono">+ - * / %</code>, comparisons,{" "}
            <code className="font-mono">&amp;&amp;</code> <code className="font-mono">||</code>,
            and <code className="font-mono">condition ? a : b</code>.
          </p>
          <p>
            <strong className="text-body">Functions:</strong>{" "}
            <code className="font-mono">min max ceil floor round abs</code>.
          </p>
          <p>
            <strong className="text-body">Example — 2% capped at ₱200:</strong>{" "}
            <code className="font-mono">min(amount * 0.02, 200)</code>
          </p>
          <p>
            <strong className="text-body">Example — free to receive:</strong>{" "}
            <code className="font-mono">direction == &quot;receive&quot; ? 0 : 20</code>
          </p>
        </div>
      </details>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || (trimmed !== "" && !validation?.ok)}
        >
          {saving ? "Saving..." : "Save formula"}
        </Button>
        {initial && (
          <Button type="button" variant="outline" onClick={() => setFormula("")}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
