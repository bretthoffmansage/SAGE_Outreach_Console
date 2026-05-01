import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const roleValidator = v.union(
  v.literal("admin"),
  v.literal("operator"),
  v.literal("bari"),
  v.literal("blue"),
  v.literal("viewer"),
);

function initialsFor(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "User";
  const parts = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "US";
}

export const listUserProfiles = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.sort((left, right) => left.name.localeCompare(right.name));
  },
});

export const getCurrentUserProfile = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId)).unique();
  },
});

export const upsertCurrentUserProfile = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId)).unique();
    const name = args.name ?? existing?.name ?? "Console User";
    const email = args.email ?? existing?.email ?? `${args.clerkUserId}@unknown.local`;
    const roles = existing?.roles?.length ? existing.roles : [args.role];

    if (existing?._id) {
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        email,
        name,
        roles: roles[0] === args.role ? roles : [args.role],
        avatarInitials: initialsFor(name, email),
      });
      return { success: true as const, mode: "updated" as const, clerkUserId: args.clerkUserId };
    }

    await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email,
      name,
      roles: [args.role],
      avatarInitials: initialsFor(name, email),
    });
    return { success: true as const, mode: "inserted" as const, clerkUserId: args.clerkUserId };
  },
});

export const updateUserRole = mutation({
  args: {
    clerkUserId: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId)).unique();
    if (!existing) {
      throw new Error("User not found");
    }
    await ctx.db.patch(existing._id, {
      roles: [args.role],
    });
    return { success: true as const, clerkUserId: args.clerkUserId, role: args.role };
  },
});
