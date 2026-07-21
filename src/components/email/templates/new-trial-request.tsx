import { EmailLayout, EmailHeading, EmailText, EmailButton } from "@/components/email/layout";

export function NewTrialRequestEmail({ storeName, adminUrl }: { storeName: string; adminUrl: string }) {
  return (
    <EmailLayout preview={`${storeName} requested credits`}>
      <EmailHeading>New credit request</EmailHeading>
      <EmailText>
        <strong>{storeName}</strong> just requested more AI credits. Review and approve it from the admin dashboard.
      </EmailText>
      <EmailButton href={adminUrl}>Review request</EmailButton>
    </EmailLayout>
  );
}
