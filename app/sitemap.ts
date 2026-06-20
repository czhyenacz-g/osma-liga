import type { MetadataRoute } from "next";
import { getClubs } from "@/lib/clubs";
import { CLUBS as STATIC_CLUBS } from "@/data/clubs";
import { absoluteUrl } from "@/lib/seo";
import { LEAGUE_LANDING_PAGES } from "@/lib/leagueLandingPages";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/kluby"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const leagueRoutes: MetadataRoute.Sitemap = LEAGUE_LANDING_PAGES.map((league) => ({
    url: absoluteUrl(`/${league.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // Only public, indexable club pages. Falls back to static club data if the
  // API is unavailable so the build/sitemap never fails because of it.
  const clubs = await getClubs().catch(() => STATIC_CLUBS);

  const clubRoutes: MetadataRoute.Sitemap = clubs.map((club) => ({
    url: absoluteUrl(`/kluby/${club.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...leagueRoutes, ...clubRoutes];
}
