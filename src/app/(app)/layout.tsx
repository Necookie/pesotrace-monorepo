import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/top-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single();

  let storeName = "My Store";
  if (profile?.store_id) {
    const { data: store } = await supabase
      .from("stores")
      .select("name")
      .eq("id", profile.store_id)
      .single();
    if (store?.name) storeName = store.name;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav storeName={storeName} email={user.email ?? ""} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
