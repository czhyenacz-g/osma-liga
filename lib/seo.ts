export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.osmaliga.cz").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export const siteName = "Osmá liga";

export const defaultDescription =
  "Osmá liga je online fotbalový svět inspirovaný 8. ligou a okresním fotbalem. Sleduj kluby, výsledky, výzvy k zápasu a nastup na plac.";

export function ogImageUrl(title: string, sub?: string): string {
  const params = new URLSearchParams({ title });
  if (sub) params.set("sub", sub);
  return `/api/og?${params.toString()}`;
}

export const defaultOgImage = ogImageUrl(siteName, "VAR nemáme, hraj dál.");
