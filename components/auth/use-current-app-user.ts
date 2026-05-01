"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { defaultRoleForEnvironment, displayNameFromUser, initialsFromUser, normalizeUserRole, type UserRole } from "@/lib/auth";

export function useCurrentAppUser() {
  const { isLoaded, isSignedIn, user } = useUser();
  const profile = useQuery(api.users.getCurrentUserProfile, user?.id ? { clerkUserId: user.id } : "skip");
  const upsertProfile = useMutation(api.users.upsertCurrentUserProfile);

  const metadataRole = normalizeUserRole((user?.publicMetadata?.role as string | undefined) ?? undefined, defaultRoleForEnvironment());
  const profileRole = normalizeUserRole(profile?.roles?.[0], metadataRole);
  const role: UserRole = profileRole || metadataRole;
  const displayName = displayNameFromUser(user?.fullName, user?.primaryEmailAddress?.emailAddress);
  const email = user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? null;
  const avatarInitials = useMemo(
    () => initialsFromUser(user?.fullName, user?.primaryEmailAddress?.emailAddress ?? profile?.email ?? null),
    [profile?.email, user?.fullName, user?.primaryEmailAddress?.emailAddress],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    void upsertProfile({
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: displayName,
      role,
    }).catch(() => {
      // Auth scaffolding should not block the rest of the console.
    });
  }, [displayName, isLoaded, isSignedIn, role, upsertProfile, user?.id, user?.primaryEmailAddress?.emailAddress]);

  return {
    isLoaded,
    isSignedIn,
    role,
    displayName,
    email,
    clerkUserId: user?.id ?? null,
    avatarInitials,
  };
}
