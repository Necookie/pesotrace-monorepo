import Link from "next/link";

const NAV = [
  { href: "/settings/fee-tiers", label: "Fee tiers" },
  { href: "/settings/phone-numbers", label: "Phone numbers" },
  { href: "/settings/branches", label: "Branches" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:flex-row sm:gap-8 sm:p-6">
      <aside className="flex gap-1 overflow-x-auto sm:w-48 sm:shrink-0 sm:flex-col sm:space-y-1 sm:overflow-visible">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block shrink-0 rounded-pill px-3 py-1.5 text-sm font-medium text-body hover:bg-surface-strong hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Retention policy
        </div>
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Branding
        </div>
        <div className="hidden rounded-pill px-3 py-1.5 text-sm text-muted-soft sm:block">
          Notifications
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
