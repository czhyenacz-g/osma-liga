import LeagueHeader from "@/components/league/LeagueHeader";
import MatchHero from "@/components/league/MatchHero";
import ClubGrid from "@/components/league/ClubGrid";
import NewsSection from "@/components/league/NewsSection";
import LeagueTable from "@/components/league/LeagueTable";
import SiteFooter from "@/components/league/SiteFooter";

export default function HomePage() {
  return (
    <>
      <LeagueHeader />
      <main>
        <MatchHero />
        <NewsSection />
        <LeagueTable />
        <ClubGrid />
      </main>
      <SiteFooter />
    </>
  );
}
