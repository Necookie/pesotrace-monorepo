"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Recharts is ~350KB — the single largest chunk in the app — and it was in
 * the initial bundle of every page that renders a chart, so the browser had
 * to parse and hydrate all of it before the page became interactive.
 *
 * These wrappers split it into its own lazily-fetched chunk. `ssr: false` is
 * deliberate: the charts are decorative-until-interactive, they read CSS
 * custom properties for their colors, and skipping them server-side keeps
 * recharts out of the server render too. That requires this module to be a
 * client component — `ssr: false` is not allowed in a server component.
 *
 * Import charts from here in pages; import the concrete components directly
 * only if you specifically need them server-rendered.
 */

function ChartFallback({ height }: { height: number }) {
  return <Skeleton className="rounded-2xl" style={{ height }} />;
}

export const SendReceiveChart = dynamic(
  () => import("./send-receive-chart").then((m) => m.SendReceiveChart),
  { ssr: false, loading: () => <ChartFallback height={340} /> }
);

export const FeeTrendChart = dynamic(
  () => import("./fee-trend-chart").then((m) => m.FeeTrendChart),
  { ssr: false, loading: () => <ChartFallback height={260} /> }
);

export const PieBreakdownChart = dynamic(
  () => import("./pie-breakdown-chart").then((m) => m.PieBreakdownChart),
  { ssr: false, loading: () => <ChartFallback height={300} /> }
);

export const CategoryBreakdownChart = dynamic(
  () => import("./category-breakdown-chart").then((m) => m.CategoryBreakdownChart),
  { ssr: false, loading: () => <ChartFallback height={300} /> }
);

export const CreditUsageChart = dynamic(
  () => import("./credit-usage-chart").then((m) => m.CreditUsageChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> }
);

export const RequestVolumeChart = dynamic(
  () => import("./request-volume-chart").then((m) => m.RequestVolumeChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> }
);

export const CostTrendChart = dynamic(
  () => import("./cost-trend-chart").then((m) => m.CostTrendChart),
  { ssr: false, loading: () => <ChartFallback height={220} /> }
);
