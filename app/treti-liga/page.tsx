import type { Metadata } from "next";
import LeagueLandingPageView from "@/components/league/LeagueLandingPage";
import { getLeagueLandingPage, buildLeagueMetadata } from "@/lib/leagueLandingPages";

const league = getLeagueLandingPage("treti-liga")!;

export const metadata: Metadata = buildLeagueMetadata(league);

export default function TretiLigaPage() {
  return <LeagueLandingPageView league={league} />;
}
