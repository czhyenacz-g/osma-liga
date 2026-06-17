import type { MetadataRoute } from "next";
import { CLUBS } from "@/data/clubs";

const BASE = "https://www.osmaliga.cz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/satna`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/hra/bot`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/hra/multiplayer`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/hra/online`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/kluby`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const clubRoutes: MetadataRoute.Sitemap = CLUBS.map((club) => ({
    url: `${BASE}/kluby/${club.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...clubRoutes];
}
