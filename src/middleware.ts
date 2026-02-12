import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/forms(.*)",
  "/api/email(.*)",
  "/embed",
  "/landing(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const host = req.nextUrl.hostname;
  const isLandingDomain = host === "www.thebellcrm.eu";

  // www.thebellcrm.eu = landing only. Show landing at "/", redirect everything else to app.
  if (isLandingDomain) {
    const pathname = req.nextUrl.pathname;
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL("/landing", req.url));
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.thebellcrm.eu";
    return NextResponse.redirect(new URL(pathname + req.nextUrl.search, appUrl));
  }

  // app.thebellcrm.eu (or localhost in dev): normal app + auth
  if (!isPublicRoute(req)) await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
