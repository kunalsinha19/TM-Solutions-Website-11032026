/**
 * Central site configuration — social links, channel URLs, contact info.
 *
 * Override any value via Next.js NEXT_PUBLIC_* environment variables.
 * If a variable is not set, the hardcoded default is used so the site
 * always works without requiring every env var to be defined.
 *
 * To change the YouTube channel in the future, update only one place:
 *   Railway → web service → Variables → NEXT_PUBLIC_YOUTUBE_CHANNEL_URL
 */

export const SITE_CONFIG = {
  /** Official YouTube channel URL shown in the Shorts page, footer, and empty states. */
  youtubeChannelUrl:
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL ??
    "https://www.youtube.com/@Taramaaindia",

  /** Contact email — overrides the value pulled from WebsiteSettings for static components. */
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ??
    "taramaasolutions2025@gmail.com",

  /** Primary contact phone — used in footer and header fallbacks. */
  contactPhone:
    process.env.NEXT_PUBLIC_CONTACT_PHONE ??
    "+91 75950 56476",
} as const;
