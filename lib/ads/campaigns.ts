import { buildDognetUrl } from "@/lib/dognet";

// Reklamní kampaně spravované v Gitu: upravit pole níže → commit → push →
// Vercel deploy. Žádná administrace, DB ani adserver.
//
// Vypnutí kampaně: `active: false` (slot pak nevykreslí nic, ani obal).
// Časové okno: `validFrom` včetně, `validUntil` bez (validFrom <= now < validUntil).
// Obě hodnoty musí být ISO 8601 se zónou ("2026-11-01T00:00:00+01:00" nebo
// "…Z"); hodnota bez zóny nebo neplatná kampaň vyřadí (raději nic než
// reklama ve špatném čase).
// Více kampaní na jednom slotu: vyhrává první platná v pořadí pole. Žádná
// náhodná rotace.
//
// Na statických stránkách (ligové landing pages) se okno vyhodnotí při
// buildu — změna kampaně stejně znamená deploy.

/** Sloty, které se dnes opravdu vykreslují. */
export type AdSlotId = "homepage_primary" | "league_page";

/**
 * `gambling` je jen připravená kategorie — getActiveCampaign ji vždy
 * vyřadí, dokud neproběhne samostatné právní posouzení.
 */
export type AdCategory = "partner" | "affiliate" | "internal" | "gambling";

export interface AdImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export type AdLink =
  | { type: "url"; href: string }
  // Affiliate odkaz FotbalovyDarek.cz přes lib/dognet.ts. `d2` označuje
  // pozici na webu; stránka ho může přepsat vlastním (ligové stránky
  // posílají "treti" … "osma"), aby Dognet dál rozlišoval zdroj prokliku.
  | { type: "dognet"; d2: string };

export interface AdCampaign {
  id: string;
  slot: AdSlotId;
  /** Interní název, nikde se nezobrazuje. */
  title: string;
  category: AdCategory;
  /** Viditelný textový štítek nad reklamou, např. "Partnerská nabídka". */
  label: string;
  image: AdImage;
  /** Varianta pod 640 px šířky; bez ní se použije `image`. */
  imageMobile?: AdImage;
  link: AdLink;
  active: boolean;
  validFrom?: string;
  validUntil?: string;
}

export const AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: "fotbalovydarek-homepage",
    slot: "homepage_primary",
    title: "FotbalovyDarek.cz — homepage banner (Dognet)",
    category: "affiliate",
    label: "Partnerská nabídka",
    image: {
      src: "/banner_main.webp",
      width: 2121,
      height: 210,
      alt: "FotbalovyDarek.cz — partnerská nabídka pro fotbalové fanoušky",
    },
    imageMobile: {
      src: "/banner_pro_fanousky.webp",
      width: 2127,
      height: 739,
      alt: "FotbalovyDarek.cz — dárky a suvenýry pro fotbalové fanoušky",
    },
    link: { type: "dognet", d2: "homepage-banner" },
    active: true,
  },
  {
    id: "fotbalovydarek-league",
    slot: "league_page",
    title: "FotbalovyDarek.cz — ligové landing pages (Dognet)",
    category: "affiliate",
    label: "Partnerská nabídka",
    image: {
      src: "/banner_pro_fanousky.webp",
      width: 2127,
      height: 739,
      alt: "FotbalovyDarek.cz — dárky a suvenýry pro fotbalové fanoušky",
    },
    // "main" = dřívější výchozí d2 FootballAffiliateBanneru; ligové stránky
    // ho přepisují svou ligou.
    link: { type: "dognet", d2: "main" },
    active: true,
  },
];

const ZONED_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

/** Milisekundy UTC, nebo null pro chybějící/nejednoznačnou/neplatnou hodnotu. */
function parseZoned(value: string): number | null {
  if (!ZONED_ISO.test(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isLive(c: AdCampaign, nowMs: number): boolean {
  if (!c.active || c.category === "gambling") return false;
  if (c.validFrom !== undefined) {
    const from = parseZoned(c.validFrom);
    if (from === null || nowMs < from) return false;
  }
  if (c.validUntil !== undefined) {
    const until = parseZoned(c.validUntil);
    if (until === null || nowMs >= until) return false;
  }
  return true;
}

/** První platná kampaň slotu v pořadí `campaigns`, jinak null. Bez vedlejších efektů. */
export function getActiveCampaign(
  slot: AdSlotId,
  now: Date,
  campaigns: readonly AdCampaign[] = AD_CAMPAIGNS,
): AdCampaign | null {
  const nowMs = now.getTime();
  return campaigns.find((c) => c.slot === slot && isLive(c, nowMs)) ?? null;
}

export function campaignHref(c: AdCampaign, d2Override?: string): string {
  return c.link.type === "dognet" ? buildDognetUrl(d2Override ?? c.link.d2) : c.link.href;
}

/** Vlastní propagace (`internal`) není placená reklama → bez `sponsored`. */
export function campaignRel(c: AdCampaign): string {
  return c.category === "internal" ? "noopener noreferrer" : "sponsored noopener noreferrer";
}
