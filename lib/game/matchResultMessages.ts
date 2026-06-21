// Hlášky u posledních výsledků zápasů (homepage / RecentResults.tsx).
// Výběr je deterministický podle ID zápasu — stejný zápas má při refreshi
// pořád stejnou hlášku, ale různé zápasy v jednom seznamu se neopakují.

export const homeWinMessages = [
  'Domácí to udrželi. Výbor zatím mlčí, což je dobré znamení.',
  'Tři body zůstávají doma. Trávník to nějak rozdýchá.',
  'Domácí přežili závěr i vlastní rozehrávku.',
  'Fanoušci viděli výhru. Někteří dokonce i fotbal.',
  'Domácí berou výhru a u kabin se tváří, že přesně tohle plánovali.',
  'Výhra doma. Takže dneska se chyba v systému nehledá.',
  'Domácí urvali tři body. A možná i kus lajny u rohového praporku.',
  'Na domácím hřišti se body rozdávají nerady. Dneska vůbec.',
  'Domácí zvládli zápas i závěrečné výmluvy hostů.',
  'Tři body doma. Trenér bude mluvit o charakteru, i kdyby nemusel.',
];

export const awayWinMessages = [
  'Hosté si odvážejí výhru a domácí hledají výmluvu.',
  'Hosté přijeli, vyhráli a radši rychle odjeli.',
  'Body mizí z domácí návsi. Podezřele tiše.',
  'Hosté zvládli zápas i cestu autobusem. To se počítá.',
  'Domácí zůstali bez bodů a s dlouhou poradou v kabině.',
  'Hosté si přivezli formu. Domácí jen program zápasu.',
  'Venku se neptali a brali všechno. Včetně nálady domácích.',
  'Hosté ukázali, že i cizí trávník může být jejich.',
  'Domácí chtěli diktovat tempo. Hosté jim vzali i tužku.',
  'Výhra hostů. Domácí publikum to nese statečně, skoro.',
];

export const drawMessages = [
  'Body se dělí. Nikdo není spokojený, takže spravedlivé.',
  'Remíza, která potěšila hlavně tabulku.',
  'Oba týmy si něco odnesly. Hlavně pocit, že mohly vyhrát.',
  'Výbor rozhodl, že bod je taky bod.',
  'Nerozhodně. Přesně tak, jak to po zápase všichni vysvětlí.',
  'Každý bere bod a nikdo nechce přiznat, že to mohlo být horší.',
  'Remíza poctivá jako párek v rohlíku po zápase.',
  'Oba týmy měly své chvíle. Jen ne dost dlouhé.',
  'Zápas skončil smírem. Kabiny už tak smířlivé nejsou.',
  'Bod pro každého. A pro trenéry další materiál na dlouhou řeč.',
];

// Drobný stabilní hash — žádné kryptografické nároky, jen potřebujeme
// rozumně rozptýlený index podle ID zápasu.
function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export interface RecentMatchResult {
  id: string;
  homeScore: number;
  awayScore: number;
}

export function getRecentMatchResultMessage(
  match: RecentMatchResult,
  usedMessages?: Set<string>,
): string {
  const pool =
    match.homeScore > match.awayScore
      ? homeWinMessages
      : match.awayScore > match.homeScore
        ? awayWinMessages
        : drawMessages;

  const initialIndex = stableHash(match.id) % pool.length;

  for (let offset = 0; offset < pool.length; offset++) {
    const message = pool[(initialIndex + offset) % pool.length];
    if (!usedMessages?.has(message)) {
      usedMessages?.add(message);
      return message;
    }
  }

  // Pool vyčerpán (víc zápasů se stejným výsledkem než variant) — opakování
  // je v tomto případě v pořádku.
  return pool[initialIndex];
}
