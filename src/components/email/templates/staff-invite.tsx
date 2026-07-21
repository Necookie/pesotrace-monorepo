import { EmailLayout, EmailHeading, EmailText, EmailButton } from "@/components/email/layout";
import type { ProfileRole } from "@/lib/database.types";

const ROLE_LABEL: Record<ProfileRole, string> = {
  owner: "owner",
  manager: "manager",
  staff: "staff member",
};

export function StaffInviteEmail({
  storeName,
  role,
  acceptUrl,
}: {
  storeName: string;
  role: ProfileRole;
  acceptUrl: string;
}) {
  return (
    <EmailLayout preview={`You've been invited to join ${storeName} on PesoTrace`}>
      <EmailHeading>You&apos;re invited to {storeName}</EmailHeading>
      <EmailText>
        You&apos;ve been invited to join <strong>{storeName}</strong> on PesoTrace as a {ROLE_LABEL[role]}.
      </EmailText>
      <EmailText>Accept the invite to get access to the store&apos;s ledger, uploads, and reports.</EmailText>
      <EmailButton href={acceptUrl}>Accept invite</EmailButton>
      <EmailText>This invite expires in 7 days. If you weren&apos;t expecting this, you can ignore it.</EmailText>
    </EmailLayout>
  );
}
