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
  let { data: profile } = await supabase
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
      if (profileError.code === "23505") {
        // Handle concurrent request race condition gracefully:
        // Fetch the profile that was just inserted by the concurrent request
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("store_id")
          .eq("id", user.id)
          .single();
        profile = existingProfile;

        // Clean up the orphan store we just created to keep database clean
        await supabase.from("stores").delete().eq("id", store.id);
      } else {
        console.error("Failed to create profile on onboarding:", profileError.message);
        throw profileError;
      }
    } else {
      profile = { store_id: store.id };
    }
  }

  // Load store name
  if (profile) {
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
