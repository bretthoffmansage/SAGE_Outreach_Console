"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@/lib/auth";

export type AppUserState = {
  clerkConfigured: boolean;
  isLoaded: boolean;
  isSignedIn: boolean;
  /** Role used for nav, route access, and approvals (may reflect full-access override). */
  role: UserRole;
  /** Role from Clerk metadata / Convex profile; use when re-enforcing fine-grained roles. */
  storedRole: UserRole;
  displayName: string;
  email: string | null;
  clerkUserId: string | null;
  avatarInitials: string;
};

const defaultAppUserState: AppUserState = {
  clerkConfigured: false,
  isLoaded: true,
  isSignedIn: true,
  role: "operator",
  storedRole: "operator",
  displayName: "Demo Operator",
  email: null,
  clerkUserId: null,
  avatarInitials: "DO",
};

const AppUserContext = createContext<AppUserState>(defaultAppUserState);

export function AppUserProvider({ value, children }: { value: AppUserState; children: ReactNode }) {
  return <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>;
}

export function useAppUser() {
  return useContext(AppUserContext);
}
