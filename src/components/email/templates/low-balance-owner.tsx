import { EmailLayout, EmailHeading, EmailText, EmailButton } from "@/components/email/layout";

export function LowBalanceOwnerEmail({
  storeName,
  balance,
  appUrl,
}: {
  storeName: string;
  balance: number;
  appUrl: string;
}) {
  const isEmpty = balance <= 0;
  return (
    <EmailLayout preview={isEmpty ? `${storeName} is out of AI credits` : `${storeName} is running low on credits`}>
      <EmailHeading>{isEmpty ? "You're out of AI credits" : "Running low on AI credits"}</EmailHeading>
      <EmailText>
        <strong>{storeName}</strong> has <strong>{balance.toLocaleString()}</strong> credits left
        {isEmpty ? " — new screenshot and statement uploads are paused until you top up." : "."}
      </EmailText>
      <EmailButton href={`${appUrl}/settings/credits`}>Request more credits</EmailButton>
    </EmailLayout>
  );
}
