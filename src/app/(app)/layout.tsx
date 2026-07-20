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

  // Check if profile exists for this Clerk user. Joins the store name in the
  // same round trip since that's needed on every request too — this layout
  // runs on every page navigation, so the existing-user path (the common
  // case) should cost one query, not two.
  const { data: profile } = await supabase
    .from("profiles")
    .select("store_id, stores(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.stores?.name) {
    storeName = profile.stores.name;
  } else if (!profile) {
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

    storeName = store.name;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      store_id: store.id,
      role: "owner",
      full_name: fullName,
    });

    if (profileError) {
      if (profileError.code === "23505") {
        // Handle concurrent request race condition gracefully: fetch the
        // store that was just created by the concurrent request instead.
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("stores(name)")
          .eq("id", user.id)
          .single();
        storeName = existingProfile?.stores?.name ?? storeName;

        // Clean up the orphan store we just created to keep database clean
        await supabase.from("stores").delete().eq("id", store.id);
      } else {
        console.error("Failed to create profile on onboarding:", profileError.message);
        throw profileError;
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <TopNav storeName={storeName} email={email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
