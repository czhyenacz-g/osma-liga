import LeagueHeader from "@/components/league/LeagueHeader";
import MatchHero from "@/components/league/MatchHero";
import ClubGrid from "@/components/league/ClubGrid";
import NewsSection from "@/components/league/NewsSection";
import LeagueTable from "@/components/league/LeagueTable";
import SiteFooter from "@/components/league/SiteFooter";

export default function HomePage() {
  return (
    <>
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

      <main>
        <NewsSection />
        <LeagueTable />
        <ClubGrid />
      </main>
      <SiteFooter />
    </>
  );
}
