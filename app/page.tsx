import type { Metadata } from "next";
import LeagueHeader from "@/components/league/LeagueHeader";
import MatchHero from "@/components/league/MatchHero";
import LookingForOpponentCallout from "@/components/league/LookingForOpponentCallout";
import ClubGrid from "@/components/league/ClubGrid";
import NewsSection from "@/components/league/NewsSection";
import LeagueTable from "@/components/league/LeagueTable";
import RecentResults from "@/components/league/RecentResults";
import SiteFooter from "@/components/league/SiteFooter";
import { absoluteUrl, ogImageUrl, siteName, siteUrl } from "@/lib/seo";

const TITLE = "Osmá liga — okresní fotbal, který se bere až moc vážně";
const DESCRIPTION =
  "Parodický i hratelný svět okresního fotbalu. Kluby, tabulka, online zápasy a hláška: VAR nemáme, hraj dál.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/"),
    images: [{ url: ogImageUrl(siteName, "Okresní fotbal, který se bere až moc vážně") }],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
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
        <MatchHero />
      </div>

      <LookingForOpponentCallout />

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
