import type { Metadata } from "next";
import LeagueHeader from "@/components/league/LeagueHeader";
import GameHeroCompact from "@/components/league/GameHeroCompact";
import AdSlot from "@/components/ads/AdSlot";
import MatchHero from "@/components/league/MatchHero";
import { getActiveHomepageChallenge } from "@/lib/game/activeChallenge";
import ClubGrid from "@/components/league/ClubGrid";
import NewsSection from "@/components/league/NewsSection";
import LeagueTable from "@/components/league/LeagueTable";
import RecentResults from "@/components/league/RecentResults";
import QuickNavGrid from "@/components/league/QuickNavGrid";
import SiteFooter from "@/components/league/SiteFooter";
import { siteName, siteUrl } from "@/lib/seo";

const TITLE = "Osmá liga — vyber si tým a vlez na hřiště";
const DESCRIPTION =
  "Osmá liga je online fotbalová hra inspirovaná okresním fotbalem. Vyber si klub a hraj proti počítači nebo proti ostatním hráčům.";

const DEMO_NAV = [
  { label: "Hrát",      href: "/satna" },
  { label: "Liga",      href: "#uvod" },
  { label: "Kluby",     href: "#kluby" },
  { label: "Turnaje",   href: "/turnaj" },
  { label: "Aktuality", href: "#aktuality" },
];

// Pracovní verze budoucí homepage. Veřejná "/" zůstává coming-soon teaser,
// dokud tahle verze neprojde schválením a nenahradí ji.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
};

export default async function DemoHomePage() {
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
        <LeagueHeader navItems={DEMO_NAV} />
        <GameHeroCompact />
      </div>

      <div id="after-hero" className="px-4 py-6" style={{ background: "#041f14" }}>
        <AdSlot id="home_after_hero" />
      </div>

      {/* Vertikální reklamní slot — jen na extra-wide desktopu, nemění šířku hlavního obsahu.
          Vizuálně potlačený a zmenšený (compact promo box), aby nesoutěžil s team selectorem v hero. */}
      <div className="pointer-events-none fixed inset-y-0 right-0 z-10 hidden 2xl:block">
        <div className="pointer-events-auto sticky top-28 mr-6 w-[260px] opacity-60">
          <AdSlot id="home_sidebar" orientation="vertical" className="ad-slot-compact" />
        </div>
      </div>

      <main>
        <div className="grid gap-8 lg:grid-cols-2" style={{ background: "#0a1f10" }}>
          <MatchHero challenge={challenge} />
          <RecentResults />
        </div>

        <div className="px-4 py-6" style={{ background: "#041f14" }}>
          <AdSlot id="home_after_results" />
        </div>

        <QuickNavGrid />
        <NewsSection />
        <div id="tabulka">
          <LeagueTable />
        </div>
        <ClubGrid />
      </main>
      <SiteFooter />
    </>
  );
}
