import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/org-selection",
]);

const isOrganizationSelectionRoute = createRouteMatcher(["/org-selection"]);
const isNoOrgRoute = createRouteMatcher(["/admin", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, orgId } = await auth();

  // Let public routes pass through
  if (isPublicRoute(req)) {
    return;
  }

  // If user is not signed in, let clerk handle it
  if (!userId) {
    return;
  }

  // Admin routes work without org — auth is enforced by the page itself
  if (isNoOrgRoute(req)) {
    await auth.protect();
    return;
  }

  // If user is signed in but has no org and not on org-selection
  if (!orgId && !isOrganizationSelectionRoute(req)) {
    const orgSelectionUrl = new URL("/org-selection", req.url);
    return NextResponse.redirect(orgSelectionUrl);
  }

  // If user has org but is on org-selection, redirect to app
  if (orgId && isOrganizationSelectionRoute(req)) {
    const appUrl = new URL("/app", req.url);
    return NextResponse.redirect(appUrl);
  }

  // Protect all other routes
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
