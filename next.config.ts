import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // pdfkit reads its built-in font .afm files from disk at runtime, which
  // Next's file tracer can miss when bundled — keep it external instead.
  // NOTE: this only works on a runtime with a real filesystem (Node/Vercel).
  // Cloudflare Workers has none — see docs/CLOUDFLARE_DEPLOY.md.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;

// Makes Cloudflare bindings (R2, etc. declared in wrangler.jsonc) available
// via getCloudflareContext() during `next dev`, not just under `wrangler dev`.
// No-ops outside a Cloudflare-adapted build.
initOpenNextCloudflareForDev();
