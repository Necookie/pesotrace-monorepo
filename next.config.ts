import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its built-in font .afm files from disk at runtime, which
  // Next's file tracer can miss when bundled — keep it external instead.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
