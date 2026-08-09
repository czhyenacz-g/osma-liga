import type { Metadata } from "next";
import LeagueHeader from "@/components/league/LeagueHeader";
import MatchHero from "@/components/league/MatchHero";
import { getActiveHomepageChallenge } from "@/lib/game/activeChallenge";
import ClubGrid from "@/components/league/ClubGrid";
import NewsSection from "@/components/league/NewsSection";
import LeagueTable from "@/components/league/LeagueTable";
import RecentResults from "@/components/league/RecentResults";
import SiteFooter from "@/components/league/SiteFooter";
import { siteName, siteUrl } from "@/lib/seo";

const TITLE = "Osmá liga — okresní fotbal, který se bere až moc vážně";
const DESCRIPTION =
  "Osmá liga je online fotbalový svět inspirovaný 8. ligou a okresním fotbalem. Sleduj kluby, výsledky, výzvy k zápasu a nastup na plac.";

// Dočasná archivní route: plná homepage, dokud je na "/" coming-soon teaser.
// Vidí ji dál lokálně vývojáři, ale je vyloučena z indexace (viz robots.ts).
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

      {/* Sdílené stadionové pozadí pro header + hero */}
      <div
        style={{
          backgroundImage: "url(/top_background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }}
      >
        <LeagueHeader />
        <MatchHero challenge={challenge} />
      </div>

      <main>
        <RecentResults />
        <NewsSection />
        <LeagueTable />
        <ClubGrid />
      </main>
      <SiteFooter />
    </>
  );
}
