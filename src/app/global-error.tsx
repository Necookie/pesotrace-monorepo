"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring";

/**
 * Catches errors that escape the root layout itself (Providers, ClerkProvider
 * setup, etc.) — Next requires this to render its own <html>/<body> since it
 * fully replaces the layout tree, so it can't rely on globals.css or any
 * other app provider being available.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureException(error, { digest: error.digest, boundary: "global" });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>Something went wrong</h1>
          <p style={{ maxWidth: "24rem", color: "#5b616e" }}>
            We&apos;ve logged the error. Try again, or refresh the page if it keeps happening.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: "9999px",
              background: "#0052ff",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
