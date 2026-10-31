import type { MatchFeed } from "@/lib/football/matches";

// Jediné místo, kde se "Kam na fotbal?" dozví o skutečných utkáních.
//
// Dnes nemáme ověřený zdroj termínů, proto feed vrací `unavailable` a
// ligové stránky ukazují jen poctivou zprávu (žádné filtry, mapa ani
// fiktivní zápasy). Demo data jsou v lib/football/demoMatches.ts a smí je
// používat jen testy a neindexovaná /dev/football-matches.
//
// Napojení skutečného zdroje (schválený partner, statický JSON v repu,
// kolekce v Content API, …): načíst záznamy ZDE, každý projít
// normalizeMatch() a vrátit { status: "ok", matches, sourceName }. Při
// chybě zdroje vracet `unavailable`, nikdy prázdný seznam — ten by tvrdil,
// že se nic nehraje.
export async function getUpcomingMatches(): Promise<MatchFeed> {
  return { status: "unavailable" };
}
