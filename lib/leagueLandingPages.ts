import type { Metadata } from "next";
import { absoluteUrl, ogImageUrl } from "@/lib/seo";

// Config-driven content for the per-league SEO landing pages under /[slug]-liga.
// Each entry maps 1:1 to a route in app/(league pages) and, eventually, to a
// purchased domain redirected at the DNS/registrar level (Active24).
//
// TODO(hostname-routing): once we want real hostname-based routing instead of
// a manual 301 redirect per domain, map hostnames to slugs here, e.g.:
//   tretiliga.cz   -> treti-liga
//   ctvrtaliga.cz  -> ctvrta-liga
//   pataliga.cz    -> pata-liga
//   sestaliga.cz   -> sesta-liga
//   sedmaliga.cz   -> sedma-liga
// and read the mapping in middleware.ts to rewrite by Host header.

export type LeagueLandingPage = {
  slug: string;
  displayName: string;
  /** Domain that will be 301-redirected to this page, if one was bought. */
  externalDomain: string | null;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  ctaText: string;
  matchesPlaceholder: string;
  oddsPlaceholder: string;
  /** One-line description of this league's tone, used in copy/comments only. */
  tone: string;
};

export const LEAGUE_LANDING_PAGES: LeagueLandingPage[] = [
  {
    slug: "treti-liga",
    displayName: "Třetí liga",
    externalDomain: "tretiliga.cz",
    metaTitle: "Třetí liga — skoro profíci, pořád ale nižší fotbal",
    metaDescription:
      "Třetí liga je svět skoro profesionálního amatérského fotbalu inspirovaný českými okresními a krajskými soutěžemi. Zápasy, výsledky a fotbalový chaos o pár pater výš.",
    heroTitle: "Třetí liga",
    heroSubtitle: "Zápasy, výsledky, kurzy a fotbalový chaos o pár pater výš.",
    intro:
      "Třetí liga je úroveň, kde si týmy už říkají, že hrají skoro profesionálně — dres sedí, rozcvička má řád a někdo si dokonce vede statistiky. Pořád je to ale amatérský fotbal s ambicemi o level vyšší, než kolik reálně předvádí na hřišti.",
    ctaText: "Vstoupit do světa Osmé ligy",
    matchesPlaceholder:
      "Tady bude postupně prostor pro přehled zápasů, výsledků a klubových příběhů spojených s touto ligovou úrovní.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "skoro profíci, vyšší ambice, pořád ale nižší fotbal",
  },
  {
    slug: "ctvrta-liga",
    displayName: "Čtvrtá liga",
    externalDomain: "ctvrtaliga.cz",
    metaTitle: "Čtvrtá liga — vážnější amatérský fotbal a lokální rivality",
    metaDescription:
      "Čtvrtá liga je svět vážnějšího amatérského fotbalu a lokálních rivalit inspirovaný českými okresními soutěžemi. Zápasy, výsledky a fotbalová realita o patro níž.",
    heroTitle: "Čtvrtá liga",
    heroSubtitle: "Zápasy, výsledky a lokální rivality, které se řeší roky.",
    intro:
      "Čtvrtá liga je o level níž, ale o to vážněji se tu bere každý sousedský duel. Tady se fotbal hraje s plným nasazením, protože prohra s vesnicí odvedle se na hospodě probírá ještě měsíc.",
    ctaText: "Vstoupit do světa Osmé ligy",
    matchesPlaceholder:
      "Tady bude postupně prostor pro přehled zápasů, výsledků a klubových příběhů spojených s touto ligovou úrovní.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "vážnější amatérský fotbal, lokální rivality",
  },
  {
    slug: "pata-liga",
    displayName: "Pátá liga",
    externalDomain: "pataliga.cz",
    metaTitle: "Pátá liga — mezi ambicemi a hospodou po zápase",
    metaDescription:
      "Pátá liga je svět okresního fotbalu na půl cesty mezi sportovní ambicí a hospodou po zápase. Zápasy, výsledky a atmosféra, která se nikam nežene.",
    heroTitle: "Pátá liga",
    heroSubtitle: "Něco mezi ambicí vyhrát a ambicí stihnout otevřenou hospodu.",
    intro:
      "Pátá liga je střed pomyslné stupnice — ještě se tu bojuje o body, ale už se ví, že nejdůležitější zápas dne začíná až po závěrečném hvizdu, u stolu s pivem.",
    ctaText: "Vstoupit do světa Osmé ligy",
    matchesPlaceholder:
      "Tady bude postupně prostor pro přehled zápasů, výsledků a klubových příběhů spojených s touto ligovou úrovní.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "střed mezi ambicemi a hospodou po zápase",
  },
  {
    slug: "sesta-liga",
    displayName: "Šestá liga",
    externalDomain: "sestaliga.cz",
    metaTitle: "Šestá liga — tvrdý lokální fotbal a malé stadiony",
    metaDescription:
      "Šestá liga je svět tvrdého lokálního fotbalu, známých tváří a malých stadionů inspirovaný českým okresním fotbalem. Zápasy a výsledky, které zná každý ve vesnici.",
    heroTitle: "Šestá liga",
    heroSubtitle: "Tvrdý fotbal, známé tváře, hřiště, kde tribuna je jeden lavička.",
    intro:
      "Šestá liga se hraje na hřištích, kde diváky znáte jménem a brankář je zároveň předseda klubu. Fotbal je tu tvrdší, než by čekal, kdo soutěž jen tak prolétne v tabulce.",
    ctaText: "Vstoupit do světa Osmé ligy",
    matchesPlaceholder:
      "Tady bude postupně prostor pro přehled zápasů, výsledků a klubových příběhů spojených s touto ligovou úrovní.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "tvrdý lokální fotbal, známé tváře, malé stadiony",
  },
  {
    slug: "sedma-liga",
    displayName: "Sedmá liga",
    externalDomain: "sedmaliga.cz",
    metaTitle: "Sedmá liga — poslední zastávka před opravdovým okresem",
    metaDescription:
      "Sedmá liga je poslední zastávka před opravdovým okresním fotbalem — inspirace z reálných nižších soutěží, podaná s nadhledem. Zápasy a výsledky před velkým chaosem Osmé ligy.",
    heroTitle: "Sedmá liga",
    heroSubtitle: "Poslední zastávka, než přijde opravdový okresní chaos.",
    intro:
      "Sedmá liga je poslední krok před tím, než fotbal úplně přestane předstírat organizovanost. Pořád se hraje podle pravidel, ale výbor už tiší vzdychá nad tím, co bude dál.",
    ctaText: "Vstoupit do světa Osmé ligy",
    matchesPlaceholder:
      "Tady bude postupně prostor pro přehled zápasů, výsledků a klubových příběhů spojených s touto ligovou úrovní.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "poslední zastávka před opravdovým okresem",
  },
  {
    slug: "osma-liga",
    displayName: "Osmá liga",
    externalDomain: "osmaliga.cz",
    metaTitle: "Osmá liga — hlavní herní svět okresního fotbalu",
    metaDescription:
      "Osmá liga je hlavní herní svět inspirovaný 8. ligou a okresním fotbalem — fiktivní kluby, online zápasy, výzvy a chaos. Tady se nehraje na ambice, tady se hraje pro zábavu.",
    heroTitle: "Osmá liga",
    heroSubtitle: "Fiktivní kluby, online zápasy, výzvy a fotbalový chaos v plné kráse.",
    intro:
      "Osmá liga je dno tabulky a zároveň hlavní hřiště celého projektu — herní svět, kde se hraje online, kluby jsou fiktivní a chaos je vlastně to hlavní lákadlo. Odsud se dá rovnou nastoupit do hry.",
    ctaText: "Hrát Osmou ligu",
    matchesPlaceholder:
      "Aktuální zápasy, výsledky a tabulku Osmé ligy najdeš na hlavní stránce — tahle sekce zde zůstává jako součást společné šablony pro všechny ligové úrovně.",
    oddsPlaceholder:
      "Do budoucna zde může být prostor pro partnerské odkazy, sázkové inspirace nebo přehled kurzů. Zatím nic nefingujeme.",
    tone: "hlavní herní svět, chaos, výzvy, fiktivní kluby, zápasy",
  },
];

export function getLeagueLandingPage(slug: string): LeagueLandingPage | undefined {
  return LEAGUE_LANDING_PAGES.find((league) => league.slug === slug);
}

export function buildLeagueMetadata(league: LeagueLandingPage): Metadata {
  const url = absoluteUrl(`/${league.slug}`);
  return {
    title: league.metaTitle,
    description: league.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: league.metaTitle,
      description: league.metaDescription,
      url,
      images: [{ url: ogImageUrl(league.displayName, league.heroSubtitle) }],
    },
    twitter: {
      title: league.metaTitle,
      description: league.metaDescription,
    },
  };
}
