import type { Metadata } from "next";
import LeagueLandingPageView from "@/components/league/LeagueLandingPage";
import { getLeagueLandingPage, buildLeagueMetadata } from "@/lib/leagueLandingPages";

const league = getLeagueLandingPage("sedma-liga")!;

export const metadata: Metadata = buildLeagueMetadata(league);

export default function SedmaLigaPage() {
  return <LeagueLandingPageView league={league} />;
}
