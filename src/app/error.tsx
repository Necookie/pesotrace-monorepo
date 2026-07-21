"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-medium text-ink">Something went wrong</h1>
      <p className="max-w-sm text-body">
        We&apos;ve logged the error. Try again, or refresh the page if it keeps happening.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
