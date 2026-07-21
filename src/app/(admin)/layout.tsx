import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { LogoMark } from "@/components/brand/logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 items-center border-b border-hairline bg-canvas px-6">
        <Link href="/admin" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <LogoMark size={22} className="text-primary" />
          PesoTrace Admin
        </Link>
        <span className="ml-3 rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium text-muted">
          Platform operator
        </span>
        <Link href="/dashboard" className="ml-auto text-sm font-medium text-body hover:text-ink">
          Back to app
        </Link>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
