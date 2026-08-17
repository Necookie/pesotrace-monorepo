"use client";

import { Activity } from "lucide-react";

export function AdminSystemHealth() {
  return (
    <div
      title="All platform systems operational (Supabase DB, Gemini 2.5 Flash, Storage)"
      className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <Activity className="size-3" />
      <span>Systems Operational</span>
    </div>
  );
}
