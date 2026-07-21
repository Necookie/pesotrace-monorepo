import "server-only";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { captureException } from "@/lib/monitoring-server";

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a transactional email via Resend. No-ops (returns ok: false without
 * throwing) if RESEND_API_KEY or EMAIL_FROM isn't configured — callers
 * should treat email as best-effort and never let a send failure block the
 * action that triggered it.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    return { ok: false, error: "EMAIL_FROM is not configured" };
  }

  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      react: input.react,
    });

    if (result.error) {
      await captureException(result.error, "server", { context: "sendEmail", subject: input.subject });
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (error) {
    await captureException(error, "server", { context: "sendEmail", subject: input.subject });
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}
