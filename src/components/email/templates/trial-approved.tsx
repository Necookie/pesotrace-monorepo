import { EmailLayout, EmailHeading, EmailText, EmailButton } from "@/components/email/layout";

export function TrialApprovedEmail({
  storeName,
  grantedCredits,
  appUrl,
}: {
  storeName: string;
  grantedCredits: number;
  appUrl: string;
}) {
  return (
    <EmailLayout preview={`${grantedCredits} credits added to ${storeName}`}>
      <EmailHeading>Your credit request was approved</EmailHeading>
      <EmailText>
        <strong>{grantedCredits.toLocaleString()} credits</strong> were added to <strong>{storeName}</strong>. You can
        start uploading transaction screenshots right away.
      </EmailText>
      <EmailButton href={`${appUrl}/upload`}>Go to upload</EmailButton>
    </EmailLayout>
  );
}
