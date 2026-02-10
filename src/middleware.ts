import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth protection disabled for now — re-enable later by uncommenting the block below
// import { createRouteMatcher } from "@clerk/nextjs/server";
// const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
export default clerkMiddleware(async (_auth, _req) => {
  // if (!isPublicRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
