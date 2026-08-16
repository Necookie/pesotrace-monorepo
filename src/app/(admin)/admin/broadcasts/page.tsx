import { Megaphone, Send, Clock, Users } from "lucide-react";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { BroadcastComposer } from "@/components/admin/broadcast-composer";

/**
 * Platform broadcasts page — lets operators draft and send a platform-wide
 * announcement that appears in every store's dashboard notification bar.
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

      <BroadcastComposer />

      <div className="mt-6 rounded-2xl border border-hairline bg-canvas p-6">
        <h2 className="text-sm font-semibold text-ink">Broadcast history</h2>
        <p className="mt-6 text-center text-sm text-muted">No broadcasts sent yet.</p>
      </div>
    </div>
  );
}
