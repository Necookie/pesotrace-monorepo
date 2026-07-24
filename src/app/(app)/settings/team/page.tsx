import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { TeamSettingsPanel } from "@/components/settings/team-settings-panel";

export default async function TeamSettingsPage() {
  const { userId } = await auth();
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();

  if (!storeId || !userId) {
    return <p className="text-sm text-body">Setting up your store — refresh in a moment.</p>;
  }

  const [{ data: members }, { data: pendingInvites }, { data: myProfile }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("store_id", storeId).order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("store_id", storeId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", userId).single(),
  ]);

  return (
    <TeamSettingsPanel
      members={members ?? []}
      pendingInvites={pendingInvites ?? []}
      myUserId={userId}
      myRole={myProfile?.role ?? "staff"}
    />
  );
}
