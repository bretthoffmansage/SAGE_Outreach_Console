import type { LibraryItem } from "@/lib/domain";

/** URL segment under `/libraries/...` */
export type LibraryRouteSlug =
  | "email"
  | "offers"
  | "voice-rules"
  | "signoffs"
  | "audiences"
  | "compliance"
  | "learning"
  | "copy-archive"
  | "swipe-file"
  | "voice-style"
  | "audience-intelligence"
  | "cta-library"
  | "platform-playbooks"
  | "campaign-learnings"
  | "source-imports"
  | "knowledge-sync";

export const LIBRARY_ROUTE_SLUGS: LibraryRouteSlug[] = [
  "email",
  "offers",
  "voice-rules",
  "signoffs",
  "audiences",
  "compliance",
  "learning",
  "copy-archive",
  "swipe-file",
  "voice-style",
  "audience-intelligence",
  "cta-library",
  "platform-playbooks",
  "campaign-learnings",
  "source-imports",
  "knowledge-sync",
];

export function isLibraryLearningSlug(slug: LibraryRouteSlug): boolean {
  return slug === "learning" || slug === "campaign-learnings";
}

const BUCKET_HREF: Record<string, string> = {
  copy_archive: "/libraries/copy-archive",
  swipe_file: "/libraries/swipe-file",
  voice_style: "/libraries/voice-style",
  audience_intelligence: "/libraries/audience-intelligence",
  offer_cta: "/libraries/cta-library",
  platform_playbook: "/libraries/platform-playbooks",
  campaign_learning: "/libraries/campaign-learnings",
  source_import: "/libraries/source-imports",
};

const TYPE_HREF: Record<string, string> = {
  offer: "/libraries/offers",
  lead_magnet: "/libraries/offers",
  email: "/libraries/email",
  voice_rule: "/libraries/voice-rules",
  signoff: "/libraries/signoffs",
  audience: "/libraries/audiences",
  compliance_rule: "/libraries/compliance",
  learning: "/libraries/learning",
};

const COPY_ARCHIVE_TYPES = new Set([
  "youtube_description",
  "youtube_title",
  "social_caption",
  "reel_caption",
  "tiktok_caption",
  "x_post",
  "pinterest_pin",
  "ad_copy",
  "landing_page_copy",
  "sales_page_copy",
  "webinar_copy",
  "event_copy",
  "sms_copy",
  "email_sequence",
]);

const SWIPE_TYPES = new Set(["hook", "subject_line", "swipe_example", "meme_format", "trend_example"]);

const VOICE_STYLE_TYPES = new Set(["style_rule", "phrase_to_use", "phrase_to_avoid"]);

const SOURCE_IMPORT_TYPES = new Set(["source_doc", "transcript"]);

export function libraryItemHref(item: LibraryItem): string {
  const b = item.bucket;
  if (b && BUCKET_HREF[b]) return BUCKET_HREF[b];
  return TYPE_HREF[item.type] ?? "/libraries/offers";
}

export function librarySearchCategory(item: LibraryItem): string {
  if (item.bucket && BUCKET_HREF[item.bucket]) {
    const label = item.bucket.replace(/_/g, " ");
    return label.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const labels: Record<string, string> = {
    offer: "Offer / CTA Library",
    lead_magnet: "Offer / CTA Library",
    email: "Email Library",
    voice_rule: "Voice & Style",
    signoff: "Sign-off Library",
    audience: "Audience Intelligence",
    compliance_rule: "Compliance Rules",
    learning: "Campaign Learnings",
  };
  return labels[item.type] ?? "Content Library";
}

/** Which inventory rows appear on a library page (Convex-backed items). */
export function libraryItemMatchesSlug(item: LibraryItem, slug: LibraryRouteSlug): boolean {
  switch (slug) {
    case "offers":
      return item.type === "offer" || item.type === "lead_magnet";
    case "email":
      return item.type === "email";
    case "voice-rules":
      return item.type === "voice_rule";
    case "signoffs":
      return item.type === "signoff";
    case "audiences":
      return item.type === "audience";
    case "compliance":
      return item.type === "compliance_rule";
    case "copy-archive":
      return item.bucket === "copy_archive" || COPY_ARCHIVE_TYPES.has(item.type);
    case "swipe-file":
      return item.bucket === "swipe_file" || SWIPE_TYPES.has(item.type);
    case "voice-style":
      return item.bucket === "voice_style" || item.type === "voice_rule" || VOICE_STYLE_TYPES.has(item.type);
    case "audience-intelligence":
      return item.bucket === "audience_intelligence" || item.type === "audience";
    case "cta-library":
      return item.bucket === "offer_cta" || item.type === "offer" || item.type === "lead_magnet" || item.type === "cta";
    case "platform-playbooks":
      return item.bucket === "platform_playbook" || item.type === "platform_playbook";
    case "source-imports":
      return item.bucket === "source_import" || SOURCE_IMPORT_TYPES.has(item.type);
    default:
      return false;
  }
}

export function slugFromSegment(segment: string | undefined): LibraryRouteSlug | null {
  if (!segment) return null;
  return (LIBRARY_ROUTE_SLUGS as readonly string[]).includes(segment) ? (segment as LibraryRouteSlug) : null;
}
