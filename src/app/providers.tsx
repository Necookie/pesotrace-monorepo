"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { initPostHog } from "@/lib/posthog";
import { captureException } from "@/lib/monitoring";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initPostHog();

    // React error boundaries only catch render errors — event handlers and
    // unhandled promise rejections (e.g. a failed fetch) need these instead.
    function onError(event: ErrorEvent) {
      captureException(event.error ?? event.message);
    }
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      captureException(event.reason);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
