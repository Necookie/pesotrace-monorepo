import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest, NextFetchEvent } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const handler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  return handler(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
