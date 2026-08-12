"use client";

import { useState, useMemo } from "react";
import { resolveFee, describeTier, matchTier } from "@/lib/fees";
import { formatPeso } from "@/lib/format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import type { TransactionCategory, TransactionDirection } from "@/lib/database.types";

interface FeeCalculatorSimulatorProps {
  config: FeeTierConfig;
  formula: string | null;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export function FeeCalculatorSimulator({ config, formula }: FeeCalculatorSimulatorProps) {
  const [amountInput, setAmountInput] = useState("1000");
  const [direction, setDirection] = useState<TransactionDirection>("send");
  const [category, setCategory] = useState<TransactionCategory>("cash_out");

  const amount = Math.max(0, Number(amountInput) || 0);

  const resolution = useMemo(() => {
    return resolveFee({ amount, direction, category }, { tiers: config, formula });
  }, [amount, direction, category, config, formula]);

  const matchedTier = useMemo(() => {
    return matchTier(amount, config);
  }, [amount, config]);

  const effectiveRate = amount > 0 ? ((resolution.fee / amount) * 100).toFixed(2) : "0.00";

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-surface-strong text-primary">
          <Calculator className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Fee Simulator</h2>
          <p className="text-xs text-muted">Test how your active fee configuration calculates fees for any amount.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="sim-amount">Transaction amount (₱)</Label>
          <Input
            id="sim-amount"
            type="number"
            min="0"
            step="100"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="e.g. 1000"
            className="font-mono"
          />
          <div className="flex flex-wrap gap-1 mt-1">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInput(String(amt))}
                className="rounded-pill bg-surface-soft px-2 py-0.5 text-2xs font-mono text-body hover:bg-surface-strong transition-colors"
              >
                ₱{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Direction</Label>
          <div className="flex rounded-pill bg-surface-strong p-1">
            <button
              type="button"
              onClick={() => {
                setDirection("send");
                setCategory("cash_out");
              }}
              className={`flex-1 rounded-pill py-1 text-xs font-medium transition-colors ${
                direction === "send" ? "bg-canvas text-ink shadow-sm" : "text-body"
              }`}
            >
              Send (Cash Out)
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("receive");
                setCategory("cash_in");
              }}
              className={`flex-1 rounded-pill py-1 text-xs font-medium transition-colors ${
                direction === "receive" ? "bg-canvas text-ink shadow-sm" : "text-body"
              }`}
            >
              Receive (Cash In)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm"
          >
            <option value="cash_out">Cash Out</option>
            <option value="cash_in">Cash In</option>
            <option value="load">Load</option>
            <option value="bills">Bills</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Result Card */}
      <div className="rounded-xl border border-hairline bg-surface-soft p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted uppercase">Calculated Charge</span>
            <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary uppercase">
              Via {resolution.source}
            </span>
          </div>
          <p className="mt-1 font-mono text-2xl font-bold text-primary">{formatPeso(resolution.fee)}</p>
          <p className="text-xs text-muted">
            Effective rate: <span className="font-mono font-medium text-ink">{effectiveRate}%</span> of transaction amount
          </p>
        </div>

        <div className="text-xs space-y-1 border-t sm:border-t-0 sm:border-l border-hairline pt-3 sm:pt-0 sm:pl-4 text-body">
          {formula ? (
            <div>
              <p className="font-medium text-ink">Formula:</p>
              <p className="font-mono text-2xs text-muted">{formula}</p>
            </div>
          ) : matchedTier ? (
            <div>
              <p className="font-medium text-ink">Matched Rule:</p>
              <p className="font-mono text-muted">{describeTier(matchedTier)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
