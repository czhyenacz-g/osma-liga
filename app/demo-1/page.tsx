import type { Metadata } from "next";
import LeagueHeader from "@/components/league/LeagueHeader";
import GameHero from "@/components/league/GameHero";
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

// Zachovaná referenční varianta předchozí iterace homepage (viz "/demo" pro aktuální iteraci).
// Veřejná "/" zůstává coming-soon teaser, dokud jedna z těchto verzí neprojde schválením.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
};

export default async function DemoHomePageV1() {
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
        <LeagueHeader />
        <GameHero />
      </div>

      <div className="px-4 py-6" style={{ background: "#041f14" }}>
        <AdSlot id="home_after_hero" />
      </div>

      {/* Vertikální reklamní slot — jen na extra-wide desktopu, nemění šířku hlavního obsahu */}
      <div className="pointer-events-none fixed inset-y-0 right-0 z-10 hidden 2xl:block">
        <div className="pointer-events-auto sticky top-28 mr-6 w-[280px]">
          <AdSlot id="home_sidebar" orientation="vertical" />
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
