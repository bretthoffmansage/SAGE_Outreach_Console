"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

export function AppConvexProvider({ children }: { children: ReactNode }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const client = useMemo(() => (url ? new ConvexReactClient(url) : null), [url]);
  const content = client ? <ConvexProvider client={client}>{children}</ConvexProvider> : <>{children}</>;

  if (!clerkPublishableKey) {
    return content;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  );
}
