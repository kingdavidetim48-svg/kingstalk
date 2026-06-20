import { clerkMiddleware } from "@clerk/nextjs/server";

const isPublicRoute = (pathname: string) => {
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/org-selection")
  );
};

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const isPublic = isPublicRoute(pathname);
  console.log(`[Middleware Log] Pathname: ${pathname}, isPublicRoute: ${isPublic}`);

  if (isPublic) {
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
