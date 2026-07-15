import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopNav } from "@/components/layout/top-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) {
    redirect("/login");
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName = user.fullName ?? "";

  const supabase = createAdminClient();
  let storeName = "My Store";

  // Check if profile exists for this Clerk user
  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Onboard new Clerk user: create store + owner profile
    const defaultStoreName = user.firstName ? `${user.firstName}'s Store` : "My Store";
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .insert({ name: defaultStoreName })
      .select("id, name")
      .single();

    if (storeError) {
      console.error("Failed to create store on onboarding:", storeError.message);
      throw storeError;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        store_id: store.id,
        role: "owner",
        full_name: fullName,
      });

    if (profileError) {
      console.error("Failed to create profile on onboarding:", profileError.message);
      throw profileError;
    }

    storeName = store.name;
  } else {
    // Profile exists, load store name
    const { data: store } = await supabase
      .from("stores")
      .select("name")
      .eq("id", profile.store_id)
      .single();
    if (store?.name) storeName = store.name;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav storeName={storeName} email={email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
