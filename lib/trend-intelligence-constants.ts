/** Section 7 — UI labels and filter values for Trend Intelligence. */

export const TREND_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "meta", label: "Meta" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "youtube", label: "YouTube" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "x", label: "X.com" },
  { value: "pinterest", label: "Pinterest" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "cross_platform", label: "Cross-platform" },
  { value: "other", label: "Other" },
] as const;

export const TREND_TYPES = [
  { value: "reel_format", label: "Reel format" },
  { value: "short_format", label: "Short format" },
  { value: "meme_format", label: "Meme format" },
  { value: "hook_pattern", label: "Hook pattern" },
  { value: "caption_pattern", label: "Caption pattern" },
  { value: "carousel_format", label: "Carousel format" },
  { value: "audio_trend", label: "Audio trend" },
  { value: "visual_style", label: "Visual style" },
  { value: "editing_style", label: "Editing style" },
  { value: "topic_trend", label: "Topic trend" },
  { value: "engagement_prompt", label: "Engagement prompt" },
  { value: "ad_creative_pattern", label: "Ad creative pattern" },
  { value: "influencer_pattern", label: "Influencer pattern" },
  { value: "platform_behavior", label: "Platform behavior" },
  { value: "search_trend", label: "Search trend" },
  { value: "other", label: "Other" },
] as const;

export const TREND_STATUSES = [
  { value: "candidate", label: "Candidate" },
  { value: "needs_review", label: "Needs review" },
  { value: "approved", label: "Approved" },
  { value: "used", label: "Used" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
  { value: "stale", label: "Stale" },
] as const;

export const SOURCE_SYSTEMS = [
  { value: "manual", label: "Manual" },
  { value: "web_research", label: "Web research" },
  { value: "internal_observation", label: "Internal observation" },
  { value: "swipe_file", label: "Swipe file" },
  { value: "platform_api_future", label: "Platform API (future)" },
  { value: "meta_connector_future", label: "Meta connector (future)" },
  { value: "meta_future", label: "Meta signals (future)" },
  { value: "instagram_future", label: "Instagram connector (future)" },
  { value: "facebook_future", label: "Facebook connector (future)" },
  { value: "tiktok_future", label: "TikTok connector (future)" },
  { value: "pinterest_future", label: "Pinterest connector (future)" },
  { value: "youtube_future", label: "YouTube connector (future)" },
  { value: "agent_generated", label: "Agent generated" },
  { value: "demo", label: "Demo" },
] as const;

export function labelForPlatform(value: string) {
  return TREND_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export function scoreBand(n?: number): "High" | "Medium" | "Low" | "—" {
  if (n === undefined || Number.isNaN(n)) return "—";
  if (n >= 80) return "High";
  if (n >= 50) return "Medium";
  return "Low";
}
