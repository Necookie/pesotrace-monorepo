import { Body, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";

/**
 * Hardcoded hex values, not CSS variables — email clients don't reliably
 * support custom properties. Kept in sync by hand with the tokens in
 * src/app/globals.css / docs/DESIGN_SYSTEM.md.
 */
const COLORS = {
  primary: "#0052ff",
  canvas: "#ffffff",
  surfaceSoft: "#f7f7f7",
  hairline: "#dee1e6",
  ink: "#0a0b0d",
  body: "#5b616e",
  muted: "#7c828a",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: COLORS.surfaceSoft, fontFamily: "Helvetica, Arial, sans-serif", margin: 0 }}>
        <Container
          style={{
            backgroundColor: COLORS.canvas,
            borderRadius: "24px",
            border: `1px solid ${COLORS.hairline}`,
            margin: "32px auto",
            padding: "32px",
            maxWidth: "480px",
          }}
        >
          <Text style={{ fontSize: "18px", fontWeight: 600, color: COLORS.ink, margin: "0 0 24px" }}>
            PesoTrace
          </Text>
          {children}
          <Hr style={{ borderColor: COLORS.hairline, margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "12px", color: COLORS.muted, margin: 0 }}>
            PesoTrace — GCash transaction monitoring for remittance stores.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <a
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: COLORS.primary,
          color: COLORS.canvas,
          borderRadius: "9999px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        {children}
      </a>
    </Section>
  );
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: "20px", fontWeight: 500, color: COLORS.ink, margin: "0 0 12px" }}>{children}</Text>;
}

export function EmailText({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: "14px", color: COLORS.body, lineHeight: "1.6", margin: "0 0 12px" }}>{children}</Text>;
}
