import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LeagueLandingPageView from "@/components/league/LeagueLandingPage";
import { buildLeagueMetadata, getLeagueLandingPage } from "@/lib/leagueLandingPages";
import { getUpcomingMatches } from "@/lib/football/matchSource";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("@/components/league/LeagueHeader", () => ({ default: () => null }));
vi.mock("@/components/league/SiteFooter", () => ({ default: () => null }));

const FINDER_LEAGUES = [
  ["treti-liga", "Třetí liga", "treti"],
  ["ctvrta-liga", "Čtvrtá liga", "ctvrta"],
  ["pata-liga", "Pátá liga", "pata"],
  ["sesta-liga", "Šestá liga", "sesta"],
  ["sedma-liga", "Sedmá liga", "sedma"],
] as const;

describe("ligové stránky 3.–7. liga s vyhledávačem", () => {
  it("produkční zdroj dat zatím vrací 'unavailable', ne prázdný seznam", async () => {
    expect(await getUpcomingMatches()).toEqual({ status: "unavailable" });
  });

  it.each(FINDER_LEAGUES)("%s: poctivý empty state, partner, Osmá liga, žádná fiktivní data", async (slug, title, d2) => {
    const league = getLeagueLandingPage(slug)!;
    render(await LeagueLandingPageView({ league }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
    expect(screen.getByText("Rozpis zápasů zatím připravujeme.")).toBeInTheDocument();
    expect(screen.queryByTestId("match-map")).toBeNull();
    expect(screen.queryByRole("button", { name: "Moje poloha" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/demo/i);
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();

    // Partnerská nabídka s ligovým d2.
    expect(screen.getByText("Partnerská nabídka")).toBeInTheDocument();
    const ad = document.querySelector('[data-ad-slot="league_page"] a')!;
    expect(ad.getAttribute("href")).toBe(
      `https://go.dognet.com/?chid=HgqwsHBn&d1=osmaliga&d2=${d2}&url=https%3A%2F%2Fwww.fotbalovydarek.cz%2F`,
    );
    expect(ad).toHaveAttribute("rel", "sponsored noopener noreferrer");

    // Propagace hry vede do hratelného režimu.
    expect(screen.getByText("Na zápas dnes nestíháš?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hrát Osmou ligu" })).toHaveAttribute("href", "/hra/bot");

    // Pořadí: vyhledávač → partner → Osmá liga.
    const order = [
      screen.getByTestId("match-finder-unavailable"),
      document.querySelector('[data-ad-slot="league_page"]')!,
      screen.getByText("Na zápas dnes nestíháš?"),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }

    // Vlastní canonical, žádný společný.
    expect(buildLeagueMetadata(league).alternates?.canonical).toBe(`https://www.osmaliga.cz/${slug}`);
  });

  it("osma-liga zůstává beze změny (bez vyhledávače)", async () => {
    const league = getLeagueLandingPage("osma-liga")!;
    expect(league.matchFinderLevel).toBeUndefined();
    render(await LeagueLandingPageView({ league }));
    expect(screen.queryByText("Kam na fotbal?")).toBeNull();
    expect(screen.getByText("Zápasy a výsledky")).toBeInTheDocument();
  });
});

describe("demo data neunikají do veřejných stránek", () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  }

  it("demoMatches importuje jen /dev routa a testy", () => {
    const root = path.resolve(__dirname, "../..");
    const importers = ["app", "components", "lib"]
      .flatMap((d) => files(path.join(root, d)))
      .filter((f) => /from ["']@\/lib\/football\/demoMatches["']/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f))
      .filter((f) => !/\.test\.tsx?$/.test(f));
    expect(importers).toEqual([path.join("app", "dev", "football-matches", "page.tsx")]);
  });

  it("/dev layout je noindex a na produkci 404", () => {
    const layout = readFileSync(path.resolve(__dirname, "../../app/dev/layout.tsx"), "utf8");
    expect(layout).toContain("index: false");
    expect(layout).toContain("notFoundInProduction()");
  });
});
