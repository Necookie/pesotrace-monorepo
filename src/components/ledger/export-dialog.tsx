"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trackEvent, ClientEvent } from "@/lib/analytics/events";

type Format = "csv" | "pdf";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("csv");
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));

  const invalidRange = from > to;

  function handleDownload() {
    if (invalidRange) return;
    trackEvent(ClientEvent.LedgerExported, { format });
    const url = `/api/export?format=${format}&from=${from}&to=${to}`;
    window.location.assign(url);
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Export
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Export ledger</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted">Format</Label>
              <div className="flex w-full rounded-pill bg-surface-strong p-1">
                {(["csv", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex-1 rounded-pill py-1.5 text-sm font-medium uppercase transition-colors",
                      format === f ? "bg-canvas text-ink shadow-sm" : "text-body"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted">Start date</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted">End date</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            {invalidRange && (
              <p className="text-xs text-down">Start date must be before end date.</p>
            )}

            <Button
              type="button"
              onClick={handleDownload}
              disabled={invalidRange}
              className="w-full"
            >
              Download {format.toUpperCase()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
