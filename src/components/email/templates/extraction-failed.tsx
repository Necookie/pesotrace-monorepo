import { EmailLayout, EmailHeading, EmailText, EmailButton } from "@/components/email/layout";

export function ExtractionFailedEmail({
  storeName,
  reason,
  appUrl,
}: {
  storeName: string;
  reason: string;
  appUrl: string;
}) {
  return (
    <EmailLayout preview="A screenshot upload couldn't be processed">
      <EmailHeading>An upload couldn&apos;t be processed</EmailHeading>
      <EmailText>
        A screenshot uploaded to <strong>{storeName}</strong> failed to extract: {reason}
      </EmailText>
      <EmailText>Your credit balance wasn&apos;t charged for this attempt. Try re-uploading a clearer image.</EmailText>
      <EmailButton href={`${appUrl}/upload`}>Try again</EmailButton>
    </EmailLayout>
  );
}
