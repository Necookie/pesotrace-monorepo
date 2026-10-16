"use client";

import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useReducedMotion } from "motion/react";

type Series = { name: string; data: number[] };

export function ApexAreaChart({ series, labels, colors, formatValue, formatTooltip, height = 220, compact = false }: {
  series: Series[];
  labels: string[];
  colors: string[];
  formatValue: (value: number) => string;
  formatTooltip?: (value: number, index: number) => string;
  height?: number;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const options: ApexOptions = {
    chart: {
      type: "area",
      height,
      background: "transparent",
      fontFamily: "var(--font-sans)",
      animations: { enabled: !reduceMotion && !compact, easing: "easeinout", speed: 700, dynamicAnimation: { enabled: !reduceMotion && !compact, speed: 450 } },
      zoom: { enabled: !compact, type: "x", autoScaleYaxis: true },
      toolbar: { show: !compact, autoSelected: "zoom", tools: { download: false, selection: false, pan: false, zoom: true, zoomin: true, zoomout: true, reset: true } },
      sparkline: { enabled: compact },
    },
    colors,
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: compact ? 1.5 : 2.5, lineCap: "round" },
    markers: { size: 0, hover: { size: compact ? 0 : 5 } },
    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: compact ? 0.2 : 0.32, opacityTo: 0, stops: [0, 85, 100] } },
    grid: { borderColor: "var(--color-hairline)", strokeDashArray: 3, xaxis: { lines: { show: false } }, padding: { left: 4, right: 8 } },
    xaxis: { type: "category", categories: labels, tickPlacement: "on", labels: { style: { colors: "var(--color-muted)", fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true }, axisBorder: { color: "var(--color-hairline)" }, axisTicks: { show: false }, tooltip: { enabled: false } },
    yaxis: { labels: { formatter: formatValue, style: { colors: "var(--color-muted)", fontSize: "11px" } } },
    tooltip: { theme: "light", shared: series.length > 1, intersect: false, y: { formatter: (value, context) => formatTooltip ? formatTooltip(value ?? 0, context?.dataPointIndex ?? -1) : formatValue(value ?? 0) } },
    legend: { show: series.length > 1 && !compact, position: "top", horizontalAlign: "left", fontSize: "12px", labels: { colors: "var(--color-body)" } },
  };

  return <ReactApexChart type="area" height={height} options={options} series={series} />;
}
