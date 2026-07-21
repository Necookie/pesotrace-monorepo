import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

function platformAdminIds(): string[] {
  return (process.env.PLATFORM_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isPlatformAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return platformAdminIds().includes(userId);
}

/** Gates a page/layout to platform operators only. Redirects everyone else to the app. */
export async function requirePlatformAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !isPlatformAdmin(userId)) {
    redirect("/dashboard");
  }
  return userId;
}
