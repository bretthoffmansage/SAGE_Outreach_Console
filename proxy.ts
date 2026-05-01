import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextMiddleware } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const clerkAuthEnforced = Boolean(
  process.env.CLERK_SECRET_KEY?.length && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length,
);

const clerkProtect = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

const passthrough: NextMiddleware = () => NextResponse.next();

export default clerkAuthEnforced ? clerkProtect : passthrough;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
