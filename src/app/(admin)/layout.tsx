import type { Metadata } from "next";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { LogoMark } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-hairline bg-canvas px-4 sm:px-6">
        <Link href="/admin" className="flex shrink-0 items-center gap-2 text-lg font-semibold text-ink">
          <LogoMark size={22} className="text-primary" />
          <span className="hidden sm:inline">PesoTrace Admin</span>
        </Link>
        <span className="hidden shrink-0 rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium text-muted lg:inline-block">
          Platform operator
        </span>
        <AdminNav />
        <Link
          href="/dashboard"
          className="ml-auto shrink-0 text-sm font-medium text-body hover:text-ink"
        >
          Back to app
        </Link>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
