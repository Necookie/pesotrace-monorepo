import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopNav } from "@/components/layout/top-nav";
import { findPendingInvitationByEmail, acceptInvitation } from "@/lib/invitations/accept";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // auth() reads the already-verified session locally (no network call).
  // currentUser() hits Clerk's Backend API — run it in parallel with the
  // Supabase profile query instead of blocking on it first, since neither
  // depends on the other's result (only on the userId auth() already gives
  // us for free). This layout runs on every navigation, so serializing
  // these was costing a full extra round trip on every single page load.
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const [user, profileResult] = await Promise.all([
    currentUser(),
    // Embeds store_credits in the same round trip as the profile/store
    // lookup — this used to be a separate sequential query below.
    supabase
      .from("profiles")
      .select("store_id, stores(name, store_credits(balance))")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!user) {
    redirect("/login");
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName = user.fullName ?? "";

  let storeName = "My Store";
  let creditBalance = 0;

  const { data: profile } = profileResult;
  // store_credits.store_id is a 1:1 PK relationship. PostgREST confirmed
  // (verified against the live API) it returns this embed as a single
  // object, but supabase-js's generic inference — given this hand-written
  // Database type's Relationships metadata — types it as an array. Cast
  // rather than index, since indexing [0] would silently break this.
  const embeddedCredit = profile?.stores?.store_credits as unknown as { balance: number } | null | undefined;
  if (embeddedCredit) {
    creditBalance = embeddedCredit.balance;
  }

  // A pending invite for this email takes priority over the normal
  // create-my-own-store onboarding below — join the store they were invited
  // to instead of minting a brand new one, even if they arrived via a plain
  // sign-up rather than the /invite/[token] link.
  const pendingInvitation = !profile && email ? await findPendingInvitationByEmail(supabase, email) : null;

  if (profile?.stores?.name) {
    storeName = profile.stores.name;
  } else if (pendingInvitation) {
    const result = await acceptInvitation(supabase, pendingInvitation, user.id, fullName);

    if (result.ok) {
      const { data: joinedStore } = await supabase
        .from("stores")
        .select("name")
        .eq("id", result.storeId)
        .single();
      storeName = joinedStore?.name ?? storeName;
    } else {
      console.error("Failed to auto-accept invitation on sign-up:", result.error);
      throw new Error(result.error);
    }
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
          .select("store_id, stores(name)")
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
      <TopNav storeName={storeName} email={email} creditBalance={creditBalance} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
