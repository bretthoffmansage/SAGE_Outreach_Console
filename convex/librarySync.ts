import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  buildFullObsidianMarkdown,
  buildObsidianNoteTitle,
  buildObsidianPathForLibraryItem,
  buildObsidianFrontmatter,
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

const DEMO_MAPPING_IDS = ["ksm_drive_copy_archive", "ksm_library_learnings_obsidian", "ksm_voice_style_obsidian"] as const;

export const listSyncJobs = query({
  args: {
    sourceSystem: v.optional(v.string()),
    direction: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = await ctx.db.query("librarySyncJobs").collect();
    if (args.sourceSystem) rows = rows.filter((r) => r.sourceSystem === args.sourceSystem);
    if (args.direction) rows = rows.filter((r) => r.direction === args.direction);
    if (args.status) rows = rows.filter((r) => r.status === args.status);
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const lim = Math.min(Math.max(args.limit ?? 80, 1), 200);
    return rows.slice(0, lim).map((r) => strip(r as Record<string, unknown>));
  },
});

export const createSyncJob = mutation({
  args: {
    sourceSystem: v.string(),
    targetSystem: v.optional(v.string()),
    direction: v.string(),
    mode: v.optional(v.string()),
    jobType: v.optional(v.string()),
    summary: v.optional(v.string()),
    libraryRecordId: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const syncJobId = `sync_job_${now}_${Math.random().toString(36).slice(2, 9)}`;
    await ctx.db.insert("librarySyncJobs", {
      syncJobId,
      sourceSystem: args.sourceSystem,
      targetSystem: args.targetSystem,
      direction: args.direction,
      mode: args.mode ?? "manual",
      status: "queued",
      jobType: args.jobType ?? "manual_import",
      summary: args.summary,
      libraryRecordId: args.libraryRecordId,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });
    return { syncJobId };
  },
});

export const listSourceMappings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("knowledgeSourceMappings").collect();
    return rows.sort((a, b) => b.updatedAt - a.updatedAt).map((r) => strip(r as Record<string, unknown>));
  },
});

export const upsertSourceMapping = mutation({
  args: { mappingId: v.string(), patch: v.any() },
  handler: async (ctx, args) => {
    const patch = (args.patch ?? {}) as Record<string, unknown>;
    const now = Date.now();
    const existing = await ctx.db
      .query("knowledgeSourceMappings")
      .withIndex("by_mapping_id", (q) => q.eq("mappingId", args.mappingId))
      .unique();
    const base = existing ? (strip(existing as Record<string, unknown>) as Record<string, unknown>) : {};
    const next = {
      ...base,
      ...patch,
      mappingId: args.mappingId,
      name: typeof patch.name === "string" ? patch.name : (base.name as string) ?? args.mappingId,
      sourceSystem: typeof patch.sourceSystem === "string" ? patch.sourceSystem : (base.sourceSystem as string) ?? "manual",
      targetSystem: typeof patch.targetSystem === "string" ? patch.targetSystem : (base.targetSystem as string) ?? "outreach_console",
      status: typeof patch.status === "string" ? patch.status : (base.status as string) ?? "planned",
      mode: typeof patch.mode === "string" ? patch.mode : (base.mode as string) ?? "manual",
      createdAt: typeof base.createdAt === "number" ? base.createdAt : now,
      updatedAt: now,
    };
    if (existing?._id) {
      await ctx.db.patch(existing._id, next as never);
      return { mappingId: args.mappingId, mode: "updated" as const };
    }
    await ctx.db.insert("knowledgeSourceMappings", next as never);
    return { mappingId: args.mappingId, mode: "inserted" as const };
  },
});

export const seedKnowledgeSyncDemoIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db.query("knowledgeSourceMappings").collect();
    const now = Date.now();
    let insertedMaps = 0;
    if (!mappings.length) {
      const seeds = [
        {
          mappingId: DEMO_MAPPING_IDS[0],
          name: "Drive Copy Archive to Library",
          sourceSystem: "google_drive",
          sourcePath: "Marketing / Copy Archive",
          targetSystem: "outreach_console",
          targetBucket: "copy_archive",
          targetPath: "",
          status: "planned",
          mode: "planned",
        },
        {
          mappingId: DEMO_MAPPING_IDS[1],
          name: "Library Campaign Learnings to Obsidian",
          sourceSystem: "outreach_console",
          sourcePath: "",
          targetSystem: "obsidian",
          targetBucket: "campaign_learning",
          targetPath: "Marketing/Campaign Learnings/",
          status: "planned",
          mode: "preview_only",
        },
        {
          mappingId: DEMO_MAPPING_IDS[2],
          name: "Voice & Style to Obsidian",
          sourceSystem: "outreach_console",
          sourcePath: "",
          targetSystem: "obsidian",
          targetBucket: "voice_style",
          targetPath: "Marketing/Voice and Style/",
          status: "planned",
          mode: "preview_only",
        },
      ];
      for (const s of seeds) {
        await ctx.db.insert("knowledgeSourceMappings", { ...s, createdAt: now, updatedAt: now } as never);
        insertedMaps += 1;
      }
    }

    const jobs = await ctx.db.query("librarySyncJobs").collect();
    let insertedJob = 0;
    if (!jobs.some((j) => j.jobType === "obsidian_preview" && j.summary?.includes("Voice & Style"))) {
      await ctx.db.insert("librarySyncJobs", {
        syncJobId: `sync_demo_obs_preview_${now}`,
        sourceSystem: "outreach_console",
        targetSystem: "obsidian",
        direction: "preview_only",
        mode: "dry_run",
        status: "completed",
        jobType: "obsidian_preview",
        recordsScanned: 1,
        recordsCreated: 0,
        recordsUpdated: 1,
        recordsSkipped: 0,
        recordsExported: 0,
        recordsErrored: 0,
        summary: "Generated a Markdown preview for one Voice & Style library record. No files were written.",
        startedAt: now - 60_000,
        completedAt: now - 59_000,
        createdAt: now - 59_000,
        updatedAt: now - 59_000,
        createdBy: "demo_seed",
        libraryRecordId: "vs_demo_bari_note",
      } as never);
      insertedJob = 1;
    }

    const exports = await ctx.db.query("obsidianExportRecords").collect();
    const hasDemoExport = exports.some((e) => e.libraryRecordId === "vs_demo_bari_note");
    let insertedExport = 0;
    if (!hasDemoExport) {
      const item = await ctx.db
        .query("libraryItems")
        .withIndex("by_record_id", (q) => q.eq("recordId", "vs_demo_bari_note"))
        .unique();
      if (item) {
        const lib = toLibraryRowLike(strip(item as Record<string, unknown>));
        const path = buildObsidianPathForLibraryItem(lib);
        const md = buildFullObsidianMarkdown(lib);
        const hash = computeLibraryContentHash(lib);
        const exportId = `oex_demo_${now}`;
        await ctx.db.insert("obsidianExportRecords", {
          exportId,
          libraryRecordId: "vs_demo_bari_note",
          sourceRecordTitle: buildObsidianNoteTitle(lib),
          obsidianPath: path,
          obsidianNoteTitle: buildObsidianNoteTitle(lib),
          markdownBody: md,
          frontmatterJson: JSON.stringify(buildObsidianFrontmatter(lib)),
          status: "preview_generated",
          exportMode: "preview_only",
          contentHash: hash,
          generatedAt: now,
          createdAt: now,
          updatedAt: now,
          createdBy: "demo_seed",
        } as never);
        await ctx.db.patch(item._id, {
          obsidianSyncStatus: "preview_generated",
          obsidianPath: path,
          obsidianNoteTitle: buildObsidianNoteTitle(lib),
          obsidianLastPreviewedAt: now,
          obsidianFrontmatterJson: JSON.stringify(buildObsidianFrontmatter(lib)),
          contentHash: hash,
          updatedAt: now,
        } as never);
        insertedExport = 1;
      }
    }

    return { insertedMaps, insertedJob, insertedExport };
  },
});
