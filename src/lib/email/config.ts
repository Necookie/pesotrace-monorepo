/**
 * Pure env-var validation, deliberately kept free of "server-only" so it can
 * be unit tested directly — the Resend SDK usage that actually needs the
 * server-only guarantee lives in send.ts.
 */
type EmailEnv = { RESEND_API_KEY?: string; EMAIL_FROM?: string; [key: string]: string | undefined };

export function getEmailConfigError(env: EmailEnv = process.env): string | null {
  if (!env.EMAIL_FROM) return "EMAIL_FROM is not configured";
  if (!env.RESEND_API_KEY) return "RESEND_API_KEY is not configured";
  return null;
}
