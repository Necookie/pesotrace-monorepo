import Link from "next/link";

const NAV = [
  { href: "/settings/fee-tiers", label: "Fee tiers" },
  { href: "/settings/branches", label: "Branches" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl gap-8 p-6">
      <aside className="w-48 shrink-0 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-pill px-3 py-1.5 text-sm font-medium text-body hover:bg-surface-strong hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
        <div className="rounded-pill px-3 py-1.5 text-sm text-muted-soft">
          Retention policy
        </div>
        <div className="rounded-pill px-3 py-1.5 text-sm text-muted-soft">Branding</div>
        <div className="rounded-pill px-3 py-1.5 text-sm text-muted-soft">Notifications</div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
