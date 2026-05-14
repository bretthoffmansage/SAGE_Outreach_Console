import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  buildFullObsidianMarkdown,
  buildObsidianFrontmatter,
  buildObsidianNoteTitle,
  buildObsidianPathForLibraryItem,
  computeLibraryContentHash,
  type LibraryRowLike,
} from "../lib/obsidian-markdown";

function strip<T extends Record<string, unknown>>(row: T) {
  const { _id, _creationTime, ...rest } = row as T & { _id?: unknown; _creationTime?: unknown };
  return rest;
}

function toLibraryRowLike(record: Record<string, unknown>): LibraryRowLike {
  return {
    recordId: String(record.recordId ?? ""),
    type: String(record.type ?? ""),
    name: String(record.name ?? ""),
    status: String(record.status ?? ""),
    summary: String(record.summary ?? ""),
    tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
    bucket: record.bucket as string | undefined,
    title: record.title as string | undefined,
    sourceSystem: record.sourceSystem as string | undefined,
    sourceUri: record.sourceUri as string | undefined,
    usageRights: record.usageRights as string | undefined,
    confidence: typeof record.confidence === "number" ? record.confidence : undefined,
    reviewOwner: record.reviewOwner as string | undefined,
    linkedCampaignIds: record.linkedCampaignIds as string[] | undefined,
    linkedAssetIds: record.linkedAssetIds as string[] | undefined,
    payload: record.payload as Record<string, unknown> | undefined,
    createdAt: record.createdAt as number | undefined,
    updatedAt: record.updatedAt as number | undefined,
  };
}

export const listExportRecords = query({
  args: {
    libraryRecordId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db.query("obsidianExportRecords").collect();
    if (args.libraryRecordId) rows = rows.filter((r) => r.libraryRecordId === args.libraryRecordId);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    rows.sort((a, b) => b.updatedAt - a.updatedAt);
    const lim = Math.min(Math.max(args.limit ?? 50, 1), 150);
    return rows.slice(0, lim).map((r) => strip(r as Record<string, unknown>));
  },
});

export const generateExportPreview = mutation({
  args: { libraryRecordId: v.string(), createdBy: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("libraryItems")
      .withIndex("by_record_id", (q) => q.eq("recordId", args.libraryRecordId))
      .unique();
    if (!item) {
      throw new Error("LIBRARY_RECORD_NOT_FOUND");
    }

    const lib = toLibraryRowLike(strip(item as Record<string, unknown>));
    const title = buildObsidianNoteTitle(lib);
    const path = buildObsidianPathForLibraryItem(lib);
    const markdown = buildFullObsidianMarkdown(lib);
    const fm = buildObsidianFrontmatter(lib);
    const hash = computeLibraryContentHash(lib);
    const now = Date.now();

    const prev = await ctx.db
      .query("obsidianExportRecords")
      .withIndex("by_library_record_id", (q) => q.eq("libraryRecordId", args.libraryRecordId))
      .collect();
    for (const e of prev) {
      if (e.contentHash && e.contentHash !== hash && (e.status === "preview_generated" || e.status === "export_ready")) {
        await ctx.db.patch(e._id, { status: "stale", updatedAt: now } as never);
      }
    }

    const exportId = `oex_${now}_${Math.random().toString(36).slice(2, 8)}`;
    await ctx.db.insert("obsidianExportRecords", {
      exportId,
      libraryRecordId: args.libraryRecordId,
      sourceRecordTitle: title,
      obsidianPath: path,
      obsidianNoteTitle: title,
      markdownBody: markdown,
      frontmatterJson: JSON.stringify(fm),
      status: "preview_generated",
      exportMode: "preview_only",
      contentHash: hash,
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    } as never);

    await ctx.db.patch(item._id, {
      obsidianSyncStatus: "preview_generated",
      obsidianPath: path,
      obsidianNoteTitle: title,
      obsidianLastPreviewedAt: now,
      obsidianFrontmatterJson: JSON.stringify(fm),
      contentHash: hash,
      updatedAt: now,
    } as never);

    const syncJobId = `sync_${now}_${Math.random().toString(36).slice(2, 6)}`;
    await ctx.db.insert("librarySyncJobs", {
      syncJobId,
      sourceSystem: "outreach_console",
      targetSystem: "obsidian",
      direction: "preview_only",
      mode: "dry_run",
      status: "completed",
      jobType: "obsidian_preview",
      libraryRecordId: args.libraryRecordId,
      targetPath: path,
      recordsScanned: 1,
      recordsUpdated: 1,
      summary: `Obsidian Markdown preview generated for ${args.libraryRecordId}. No files written.`,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    } as never);

    return { exportId, obsidianPath: path, markdown, warnings: [] as string[] };
  },
});

export const markExportReady = mutation({
  args: { libraryRecordId: v.string(), exportId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db
      .query("libraryItems")
      .withIndex("by_record_id", (q) => q.eq("recordId", args.libraryRecordId))
      .unique();
    if (!item?._id) throw new Error("LIBRARY_RECORD_NOT_FOUND");

    await ctx.db.patch(item._id, { obsidianSyncStatus: "export_ready", updatedAt: now } as never);

    if (args.exportId) {
      const exp = await ctx.db
        .query("obsidianExportRecords")
        .withIndex("by_export_id", (q) => q.eq("exportId", args.exportId!))
        .unique();
      if (exp?._id) await ctx.db.patch(exp._id, { status: "export_ready", updatedAt: now } as never);
    } else {
      const latest = (
        await ctx.db
          .query("obsidianExportRecords")
          .withIndex("by_library_record_id", (q) => q.eq("libraryRecordId", args.libraryRecordId))
          .collect()
      ).sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (latest?._id) await ctx.db.patch(latest._id, { status: "export_ready", updatedAt: now } as never);
    }
    return { ok: true as const };
  },
});

export const markExportedManually = mutation({
  args: { libraryRecordId: v.string(), exportId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db
      .query("libraryItems")
      .withIndex("by_record_id", (q) => q.eq("recordId", args.libraryRecordId))
      .unique();
    if (!item?._id) throw new Error("LIBRARY_RECORD_NOT_FOUND");

    await ctx.db.patch(item._id, {
      obsidianSyncStatus: "exported",
      obsidianLastExportedAt: now,
      lastExportedAt: now,
      updatedAt: now,
    } as never);

    if (args.exportId) {
      const exp = await ctx.db
        .query("obsidianExportRecords")
        .withIndex("by_export_id", (q) => q.eq("exportId", args.exportId!))
        .unique();
      if (exp?._id) await ctx.db.patch(exp._id, { status: "exported", exportedAt: now, updatedAt: now } as never);
    } else {
      const latest = (
        await ctx.db
          .query("obsidianExportRecords")
          .withIndex("by_library_record_id", (q) => q.eq("libraryRecordId", args.libraryRecordId))
          .collect()
      ).sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (latest?._id) await ctx.db.patch(latest._id, { status: "exported", exportedAt: now, updatedAt: now } as never);
    }

    await ctx.db.insert("librarySyncJobs", {
      syncJobId: `sync_manual_export_${now}_${Math.random().toString(36).slice(2, 6)}`,
      sourceSystem: "outreach_console",
      targetSystem: "obsidian",
      direction: "export",
      mode: "manual",
      status: "completed",
      jobType: "obsidian_export",
      libraryRecordId: args.libraryRecordId,
      summary: "Operator marked record as manually exported to Obsidian (no vault write from Outreach Console).",
      recordsExported: 1,
      startedAt: now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    } as never);

    return { ok: true as const };
  },
});

export const markIgnored = mutation({
  args: { libraryRecordId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db
      .query("libraryItems")
      .withIndex("by_record_id", (q) => q.eq("recordId", args.libraryRecordId))
      .unique();
    if (!item?._id) throw new Error("LIBRARY_RECORD_NOT_FOUND");
    await ctx.db.patch(item._id, { obsidianSyncStatus: "ignored", updatedAt: now } as never);
    return { ok: true as const };
  },
});

/** Operator marks Obsidian export as stale after source edits or vault changes (no file I/O). */
export const markStale = mutation({
  args: { libraryRecordId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const item = await ctx.db
      .query("libraryItems")
      .withIndex("by_record_id", (q) => q.eq("recordId", args.libraryRecordId))
      .unique();
    if (!item?._id) throw new Error("LIBRARY_RECORD_NOT_FOUND");
    await ctx.db.patch(item._id, { obsidianSyncStatus: "stale", updatedAt: now } as never);
    const exps = await ctx.db
      .query("obsidianExportRecords")
      .withIndex("by_library_record_id", (q) => q.eq("libraryRecordId", args.libraryRecordId))
      .collect();
    for (const e of exps) {
      if (e.status === "preview_generated" || e.status === "export_ready") {
        await ctx.db.patch(e._id, { status: "stale", updatedAt: now } as never);
      }
    }
    return { ok: true as const };
  },
});
