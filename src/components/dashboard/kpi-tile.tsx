export function KpiTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-medium text-ink">{value}</p>
    </div>
  );
}
