import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PesoTrace",
  description: "GCash transaction monitoring and remittance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0052ff",
          colorPrimaryForeground: "#ffffff",
          colorForeground: "#0a0b0d",
          fontFamily: "var(--font-inter)",
        },
        elements: {
          card: { borderRadius: "24px" },
          formButtonPrimary: { borderRadius: "9999px" },
          socialButtonsBlockButton: { borderRadius: "9999px" },
          formFieldInput: { borderRadius: "9999px" },
          footer: { display: "none" },
        },
      }}
    >
      <html
        lang="en"
        className={cn("h-full", "antialiased", inter.variable)}
      >
        <body className="min-h-full flex flex-col bg-canvas text-ink">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
