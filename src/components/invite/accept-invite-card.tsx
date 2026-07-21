"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptInviteAction } from "@/app/invite/[token]/actions";
import type { ProfileRole } from "@/lib/database.types";

const ROLE_LABEL: Record<ProfileRole, string> = { owner: "owner", manager: "manager", staff: "staff member" };

export function AcceptInviteCard({
  token,
  storeName,
  role,
}: {
  token: string;
  storeName: string;
  role: ProfileRole;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    const result = await acceptInviteAction(token);
    setAccepting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`You've joined ${storeName}`);
    router.push("/dashboard");
  }

  return (
    <>
      <h1 className="text-xl font-medium text-ink">Join {storeName}</h1>
      <p className="mt-2 text-sm text-body">
        You&apos;ve been invited as a {ROLE_LABEL[role]} on PesoTrace.
      </p>
      <Button type="button" className="mt-5 w-full" onClick={handleAccept} disabled={accepting}>
        {accepting ? "Joining..." : "Accept invite"}
      </Button>
    </>
  );
}
