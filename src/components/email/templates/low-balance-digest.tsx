import { EmailLayout, EmailHeading, EmailText } from "@/components/email/layout";

type LowBalanceStore = { name: string; balance: number };

export function LowBalanceDigestEmail({
  stores,
  adminUrl,
}: {
  stores: LowBalanceStore[];
  adminUrl: string;
}) {
  return (
    <EmailLayout preview={`${stores.length} store${stores.length === 1 ? "" : "s"} running low on credits`}>
      <EmailHeading>Stores running low on credits</EmailHeading>
      <EmailText>
        {stores.length} store{stores.length === 1 ? " is" : "s are"} at or below the low-balance threshold:
      </EmailText>
      <ul style={{ margin: "0 0 16px", paddingLeft: "20px" }}>
        {stores.map((store) => (
          <li key={store.name} style={{ fontSize: "14px", color: "#5b616e", marginBottom: "4px" }}>
            <strong style={{ color: "#0a0b0d" }}>{store.name}</strong> — {store.balance.toLocaleString()} credits
          </li>
        ))}
      </ul>
      <EmailText>
        <a href={adminUrl} style={{ color: "#0052ff" }}>
          Open the admin dashboard
        </a>{" "}
        to review or grant credits.
      </EmailText>
    </EmailLayout>
  );
}
