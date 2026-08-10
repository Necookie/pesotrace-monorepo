import { Megaphone, Send, Clock, Users } from "lucide-react";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";

/**
 * Platform broadcasts page — lets operators draft and send a platform-wide
 * announcement that appears in every store's dashboard notification bar.
 *
 * Phase 1: UI scaffold. The actual send action and notification delivery
 * system (via Supabase Realtime or push email) will be implemented in the
 * next milestone once the notification schema migration lands.
 */
export default function BroadcastsPage() {
  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Broadcasts</h1>
      <p className="mt-1 text-sm text-body">
        Send a platform-wide announcement visible to all store operators on their next dashboard visit.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <AdminKpiTile label="Sent this month" value="0" icon={Send} accent="primary" />
        <AdminKpiTile label="Scheduled" value="0" icon={Clock} accent="muted" />
        <AdminKpiTile label="Stores reached" value="—" icon={Users} accent="up" />
      </div>

      <div className="mt-8 rounded-2xl border border-hairline bg-canvas p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Megaphone className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-ink">New broadcast</h2>
            <p className="mt-1 text-xs text-muted">
              Compose a message to be shown to all active stores. Use this for planned maintenance windows,
              pricing changes, or feature announcements.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="broadcast-title" className="text-xs font-medium text-muted">
              Title
            </label>
            <input
              id="broadcast-title"
              type="text"
              placeholder="e.g. Scheduled maintenance on Aug 15"
              className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="broadcast-body" className="text-xs font-medium text-muted">
              Message
            </label>
            <textarea
              id="broadcast-body"
              rows={4}
              placeholder="Full announcement text…"
              className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-soft px-3 py-3">
            <svg className="size-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-xs text-muted">
              <strong className="text-body">Broadcast delivery</strong> is not yet active. This form is a scaffold
              — the send infrastructure will be wired in the next milestone.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-pill bg-primary/50 px-5 py-2 text-sm font-medium text-white cursor-not-allowed"
          >
            <Send className="size-4" />
            Send broadcast
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-hairline bg-canvas p-6">
        <h2 className="text-sm font-semibold text-ink">Broadcast history</h2>
        <p className="mt-6 text-center text-sm text-muted">No broadcasts sent yet.</p>
      </div>
    </div>
  );
}
