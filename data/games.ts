// Registr her — zatím se nikde nevykresluje. Až bude druhá skutečně
// hratelná hra, může z něj vzniknout jedna upoutávka na homepage; stránka
// /hry má smysl až od tří skutečných položek. Ligové landing pages
// (/treti-liga …) nejsou samostatné hry a sem nepatří.

export type GameStatus = "playable" | "in_progress" | "planned";

export interface Game {
  slug: string;
  title: string;
  tagline: string;
  status: GameStatus;
  /** Interní cesta nebo absolutní URL; null = zatím nikam. */
  url: string | null;
  /** Jen ověřená doména, kterou projekt opravdu používá. */
  domain: string | null;
  image: string | null;
  showOnHomepage: boolean;
}

export const GAMES: Game[] = [
  {
    slug: "osma-liga",
    title: "Osmá liga",
    tagline: "Arkádový okresní fotbal zdarma přímo v prohlížeči.",
    status: "playable",
    url: "/",
    domain: "osmaliga.cz",
    image: null,
    showOnHomepage: false,
  },
];
