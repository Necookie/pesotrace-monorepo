export function KpiTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6 min-w-0">
      <p className="text-xs sm:text-sm text-muted truncate">{label}</p>
      <p className="mt-1.5 font-mono text-lg font-medium text-ink sm:text-2xl truncate" title={value}>{value}</p>
    </div>
  );
}
