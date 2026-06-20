import type { Metadata } from "next";
import LeagueLandingPageView from "@/components/league/LeagueLandingPage";
import { getLeagueLandingPage, buildLeagueMetadata } from "@/lib/leagueLandingPages";

const league = getLeagueLandingPage("ctvrta-liga")!;

export const metadata: Metadata = buildLeagueMetadata(league);

export default function CtvrtaLigaPage() {
  return <LeagueLandingPageView league={league} />;
}
