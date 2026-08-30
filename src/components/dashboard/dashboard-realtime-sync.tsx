"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DashboardRealtimeSync({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-dashboard-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    // Auto-refresh when tab/window regains focus or visibility
    const handleFocus = () => router.refresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Heartbeat fallback every 30 seconds to guard against dropped connections
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [storeId, router]);

  return (
    <div className="flex items-center gap-1.5 rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium text-muted">
      <span
        className={`size-2 rounded-full ${
          isLive ? "bg-up animate-pulse" : "bg-muted"
        }`}
      />
      <span>{isLive ? "Live" : "Syncing"}</span>
    </div>
  );
}
