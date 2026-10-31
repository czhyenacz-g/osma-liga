import type { Metadata } from "next";
import LeagueHeader from "@/components/league/LeagueHeader";
import GameHeroCompact from "@/components/league/GameHeroCompact";
import MatchHero from "@/components/league/MatchHero";
import { getActiveHomepageChallenge } from "@/lib/game/activeChallenge";
import ClubGrid from "@/components/league/ClubGrid";
import LeagueTable from "@/components/league/LeagueTable";
import RecentResults from "@/components/league/RecentResults";
import QuickNavGrid from "@/components/league/QuickNavGrid";
import HomeAffiliateBanner from "@/components/league/HomeAffiliateBanner";
import SiteFooter from "@/components/league/SiteFooter";
import { absoluteUrl, ogImageUrl, siteName, siteUrl } from "@/lib/seo";

const TITLE = "Osmá liga — velký fotbal, malý okres";
const DESCRIPTION =
  "Arkádový okresní fotbal zdarma přímo v prohlížeči. Vyber si klub a hraj proti botovi nebo online proti ostatním hráčům.";

const HOME_NAV = [
  { label: "Hrát",    href: "/hra/bot" },
  { label: "Online",  href: "/hra/multiplayer" },
  { label: "Turnaje", href: "/turnaj" },
  { label: "Kluby",   href: "/kluby" },
];

// Veřejná homepage. Předchozí coming-soon teaser zůstává v
// components/league/ComingSoonHome.tsx pro případný rychlý rollback.
// Reklamní sloty (AdSlot) a statické aktuality (NewsSection) se tu zatím
// záměrně nevykreslují; jediná reklama je původní partnerský banner
// z teaseru (HomeAffiliateBanner, Dognet d2=homepage-banner).
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/"),
    images: [{ url: ogImageUrl(siteName, "Velký fotbal. Malý okres.") }],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    images: [ogImageUrl(siteName, "Velký fotbal. Malý okres.")],
  },
};

export default async function HomePage() {
  const challenge = await getActiveHomepageChallenge();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: DESCRIPTION,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sdílené stadionové pozadí pro header + herní hero */}
      <div
        style={{
          backgroundImage: "url(/top_background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }}
      >
        <LeagueHeader navItems={HOME_NAV} />
        <GameHeroCompact />
      </div>

      <main id="after-hero">
        {/* Živá výzva k zápasu — vykreslí se jen, když opravdu nějaká čeká */}
        <div style={{ background: "#0a1f10" }}>
          <MatchHero challenge={challenge} liveOnly />
        </div>

        {/* Partnerský banner z původního teaseru — těsně nad výsledky */}
        <section
          aria-label="Partnerská nabídka"
          className="px-4 sm:px-6 pt-8"
          style={{ background: "#0a1f10" }}
        >
          <HomeAffiliateBanner className="mx-auto block w-full max-w-5xl" />
        </section>

        <RecentResults />
        <QuickNavGrid />
        <div id="tabulka">
          <LeagueTable />
        </div>
        <ClubGrid />
      </main>
      <SiteFooter />
    </>
  );
}
