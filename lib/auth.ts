import type { NavCategory } from "@/lib/navigation";

export type UserRole = "admin" | "operator" | "bari" | "blue" | "viewer";

/**
 * When true, every signed-in user is treated as having operator-grade access for
 * `canAccessPath`, `filterNavGroupsForRole`, `canApproveReviewItem`, and UI gates
 * that receive the effective role from `effectiveRoleForSignedInUser`.
 * Set to false to restore Clerk/metadata role enforcement.
 */
export const FULL_ACCESS_FOR_ALL_SIGNED_IN_USERS = true;

const validRoles = new Set<UserRole>(["admin", "operator", "bari", "blue", "viewer"]);

export function normalizeUserRole(value: unknown, fallback: UserRole = "operator"): UserRole {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return validRoles.has(normalized as UserRole) ? (normalized as UserRole) : fallback;
}

/**
 * Maps Clerk-stored role to the role used for routing and permission helpers.
 * Persist `storedRole` from metadata/Convex; use this result for gates and labels via {@link roleLabel}.
 */
export function effectiveRoleForSignedInUser(storedRole: UserRole, isSignedIn: boolean): UserRole {
  if (!FULL_ACCESS_FOR_ALL_SIGNED_IN_USERS || !isSignedIn) return storedRole;
  if (storedRole === "admin") return "admin";
  return "operator";
}

export function defaultRoleForEnvironment() {
  return process.env.NODE_ENV === "production" ? ("viewer" as const) : ("operator" as const);
}

export function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "operator") return "Operator";
  if (role === "bari") return "Bari";
  if (role === "blue") return "Blue";
  return "Viewer";
}

export function canApproveReviewItem(role: UserRole, owner: "bari" | "blue" | "internal") {
  if (role === "admin" || role === "operator") return true;
  if (role === "viewer") return false;
  return role === owner;
}

export function canAccessPath(role: UserRole, pathname: string) {
  if (role === "admin" || role === "operator") return true;
  if (role === "bari") {
    return pathname === "/dashboard" || pathname.startsWith("/reviews/bari") || pathname.startsWith("/reviews/all");
  }
  if (role === "blue") {
    return pathname === "/dashboard" || pathname.startsWith("/reviews/blue") || pathname.startsWith("/reviews/all");
  }
  return pathname === "/dashboard" || pathname.startsWith("/reviews/all");
}

export function filterNavGroupsForRole(navGroups: NavCategory[], role: UserRole) {
  if (role === "admin" || role === "operator") return navGroups;

  return navGroups
    .map((group) => {
      if (group.id === "home") return group;

      if (group.id !== "review") {
        return { ...group, children: [] };
      }

      const allowedReviewChildren = group.children.filter((child) => {
        if (role === "bari") return child.href === "/reviews/bari" || child.href === "/reviews/all";
        if (role === "blue") return child.href === "/reviews/blue" || child.href === "/reviews/all";
        return child.href === "/reviews/all";
      });

      if (!allowedReviewChildren.length) {
        return { ...group, children: [] };
      }

      return {
        ...group,
        defaultHref: allowedReviewChildren[0].href,
        children: allowedReviewChildren,
      };
    })
    .filter((group) => group.children.length > 0);
}

export function displayNameFromUser(name?: string | null, email?: string | null) {
  return name?.trim() || email?.trim() || "Console User";
}

export function initialsFromUser(name?: string | null, email?: string | null) {
  const source = displayNameFromUser(name, email);
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "CU";
}
