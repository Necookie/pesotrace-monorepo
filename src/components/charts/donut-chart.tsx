"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type DonutSegment = { id: string; name: string; value: number; color: string };
type PlacedSegment = DonutSegment & { share: number; start: number; sweep: number };
type ChartContext = { segments: PlacedSegment[]; total: number; active: string | null; setActive: (id: string | null) => void; selectedId?: string | null; onSelect?: (id: string) => void; formatValue: (value: number) => string; label: string; thickness: number };
const Context = createContext<ChartContext | null>(null);
function useChart() { const context = useContext(Context); if (!context) throw new Error("Donut parts must be inside DonutChart"); return context; }

export function DonutChart({ segments, children, formatValue = String, label = "Donut chart", selectedId, onSelect, thickness = 24, gap = 3, className = "" }: { segments: readonly DonutSegment[]; children: ReactNode; formatValue?: (value: number) => string; label?: string; selectedId?: string | null; onSelect?: (id: string) => void; thickness?: number; gap?: number; className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const positive = segments.filter((segment) => segment.value > 0);
  const total = positive.reduce((sum, segment) => sum + segment.value, 0);
  const placed = positive.map((segment, index) => { const sweep = segment.value / total * 360; const start = positive.slice(0, index).reduce((sum, previous) => sum + previous.value / total * 360, 0); return { ...segment, share: segment.value / total, start, sweep: Math.max(0, sweep - Math.min(gap, sweep * .4)) }; });
  return <Context.Provider value={{ segments: placed, total, active, setActive, selectedId, onSelect, formatValue, label, thickness }}><div className={className}>{children}</div></Context.Provider>;
}

function point(deg: number, radius: number) { const angle = (deg - 90) * Math.PI / 180; return `${100 + Math.cos(angle) * radius} ${100 + Math.sin(angle) * radius}`; }
function arc(segment: PlacedSegment) { const sweep = Math.min(segment.sweep, 359.9); const end = segment.start + sweep; return `M ${point(segment.start, 78)} A 78 78 0 ${sweep > 180 ? 1 : 0} 1 ${point(end, 78)}`; }

export function DonutChartPlot({ children, className = "" }: { children?: ReactNode; className?: string }) {
  const { segments, active, setActive, label, thickness } = useChart();
  return <div className={`relative mx-auto aspect-square w-full max-w-[220px] ${className}`} onMouseLeave={() => setActive(null)}>
    <svg viewBox="0 0 200 200" className="h-full w-full overflow-visible" role="img" aria-label={label}>
      <circle cx="100" cy="100" r="78" fill="none" stroke="var(--color-surface-strong)" strokeWidth={thickness} />
      {segments.map((segment) => <path key={segment.id} d={arc(segment)} pathLength={1} fill="none" stroke={segment.color} strokeWidth={thickness} strokeLinecap="round" className="donut-segment cursor-pointer transition-all duration-500" style={{ opacity: active && active !== segment.id ? .35 : 1, filter: active === segment.id ? "brightness(1.08)" : undefined }} onMouseEnter={() => setActive(segment.id)} onFocus={() => setActive(segment.id)} onBlur={() => setActive(null)} tabIndex={0} aria-label={`${segment.name}: ${Math.round(segment.share * 100)} percent`} />)}
    </svg>
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">{children}</div>
  </div>;
}

export function DonutChartCenter({ totalLabel = "Total", className = "" }: { totalLabel?: ReactNode; className?: string }) {
  const { segments, active, total, formatValue } = useChart();
  const focused = segments.find((segment) => segment.id === active);
  return <div className={className} aria-live="polite"><div className="font-mono text-lg font-semibold text-ink">{formatValue(focused?.value ?? total)}</div><div className="mt-1 text-xs text-muted">{focused?.name ?? totalLabel}</div></div>;
}

export function DonutChartLegend({ className = "" }: { className?: string }) {
  const { segments, setActive, selectedId, onSelect, formatValue } = useChart();
  return <ul className={`space-y-1 ${className}`}>{segments.map((segment) => <li key={segment.id}><button type="button" aria-pressed={selectedId === segment.id} onClick={() => onSelect?.(segment.id)} onMouseEnter={() => setActive(segment.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(segment.id)} onBlur={() => setActive(null)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-primary ${selectedId === segment.id ? "bg-surface-soft" : ""}`}><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} /><span className="min-w-0 flex-1 truncate text-body">{segment.name}</span><span className="font-mono text-muted">{Math.round(segment.share * 100)}%</span><span className="font-mono font-medium text-ink">{formatValue(segment.value)}</span></button></li>)}</ul>;
}
