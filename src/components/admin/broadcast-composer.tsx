"use client";

import { useState } from "react";
import { Megaphone, Send, Info, AlertTriangle, AlertCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type BroadcastPriority = "info" | "warning" | "critical";

const PRIORITY_STYLES: Record<
  BroadcastPriority,
  { label: string; icon: typeof Info; bannerClass: string; badgeClass: string }
> = {
  info: {
    label: "Info",
    icon: Info,
    bannerClass: "border-primary/30 bg-primary/5 text-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    bannerClass: "border-amber-500/30 bg-amber-500/5 text-amber-800",
    badgeClass: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  critical: {
    label: "Urgent",
    icon: AlertCircle,
    bannerClass: "border-rose-500/30 bg-rose-500/5 text-rose-800",
    badgeClass: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
};

export function BroadcastComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<BroadcastPriority>("info");

  const PriorityIcon = PRIORITY_STYLES[priority].icon;

  return (
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
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-muted">Priority level:</label>
          {(["info", "warning", "critical"] as BroadcastPriority[]).map((p) => {
            const config = PRIORITY_STYLES[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "rounded-pill border px-2.5 py-1 text-xs font-medium transition-colors",
                  priority === p
                    ? config.badgeClass + " font-semibold ring-1 ring-primary/20"
                    : "border-hairline text-muted hover:text-ink"
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="broadcast-title" className="text-xs font-medium text-muted">
            Title
          </label>
          <input
            id="broadcast-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance on Aug 20"
            className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="broadcast-body" className="text-xs font-medium text-muted">
              Message
            </label>
            <span className="text-[11px] text-muted">{body.length} characters</span>
          </div>
          <textarea
            id="broadcast-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Full announcement text and merchant instructions…"
            className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Live Preview */}
        {(title.trim() || body.trim()) && (
          <div className="space-y-2 rounded-xl border border-dashed border-hairline bg-surface-soft p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Eye className="size-3.5" />
              <span>Merchant Banner Preview</span>
            </div>
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 transition-all",
                PRIORITY_STYLES[priority].bannerClass
              )}
            >
              <PriorityIcon className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold">{title.trim() || "Announcement Title"}</h4>
                <p className="mt-0.5 text-xs opacity-90 whitespace-pre-wrap">
                  {body.trim() || "Announcement details will appear here…"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-soft px-3 py-3">
          <Info className="size-4 shrink-0 text-muted" />
          <p className="text-xs text-muted">
            <strong className="text-body">Broadcast delivery</strong> is scheduled for real-time delivery via Supabase Realtime channels.
          </p>
        </div>

        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          className={cn(
            "inline-flex items-center gap-2 rounded-pill px-5 py-2 text-sm font-medium text-white transition-colors",
            title.trim() && body.trim()
              ? "bg-primary hover:bg-primary/90 shadow-sm"
              : "bg-primary/40 cursor-not-allowed"
          )}
        >
          <Send className="size-4" />
          Send broadcast
        </button>
      </div>
    </div>
  );
}
