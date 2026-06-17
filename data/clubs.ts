export interface Club {
  id: string;
  slug: string;
  name: string;
  banner: string;
  note: string;
  location: string;
  colors: string;
  motto: string;
  description: string;
  seasonComment: string;
}

export const CLUBS: Club[] = [
  {
    id: "nahoda_fc",
    slug: "nahoda-fc",
    name: "Náhoda FC",
    banner: "/nahoda_banner.webp",
    note: "Klub, který nikdy neměl postoupit. Bohužel postoupil.",
    location: "Hřiště za hasičárnou",
    colors: "zelená, krémová, zlatá",
    motto: "VAR nemáme, hraj dál.",
    description:
      "Náhoda FC je klub, který se do Osmé ligy nedostal výkonem, ale okolnostmi — a od té doby se snaží dokázat, že i omyl může mít tabulkové ambice.",
    seasonComment:
      "Když míč odskočí správným směrem, tým tomu říká taktika, když špatným, tak rozhodčí stejně nic neviděl.",
  },
  {
    id: "tj_sokol_tupoljany",
    slug: "tj-sokol-tupoljany",
    name: "TJ Sokol Tupoljany",
    banner: "/banners/tj_sokol_tupoljany.webp",
    note: "Soupeř z posledního utkání. Ještě pořád počítá góly.",
    location: "Sokolské hřiště u remízku",
    colors: "červená a bílá",
    motto: "Když je míč kulatý, musí někam letět.",
    description:
      "TJ Sokol Tupoljany hraje fotbal přímočaře: když je míč kulatý, je potřeba ho někam poslat, ideálně směrem, kde stojí méně soupeřů.",
    seasonComment:
      "Do sezony vstoupili Tupoljanští s energií, která by stačila i na dva poločasy navíc, jen se zatím řeší, kdo na ně má čas.",
  },
  {
    id: "sk_dolni_lhota",
    slug: "sk-dolni-lhota",
    name: "SK Dolní Lhota",
    banner: "/banners/sk_dolni_lhota.webp",
    note: "Solidní tým ze Lhoty. Lhoty je v kraji víc.",
    location: "Areál Pod Lípou",
    colors: "modrá a bílá",
    motto: "Doma se body neztrácí, jen občas zapomenou.",
    description:
      "SK Dolní Lhota je tým, který umí z každého zápasu udělat lokální událost, zvlášť když přijde víc lidí než hráčů na lavičku.",
    seasonComment:
      "Sezona vypadá nadějně, pokud se podaří udržet obranu, kádr a síť v brance pohromadě.",
  },
  {
    id: "fk_parezov",
    slug: "fk-parezov",
    name: "FK Pařezov",
    banner: "/banners/fk_parezov.webp",
    note: "Tým, který bere domácí prostředí doslova.",
    location: "Hřiště U Starého pařezu",
    colors: "hnědá a zelená",
    motto: "Kořeny máme hluboko, skluz ještě níž.",
    description:
      "FK Pařezov staví hru na tvrdém středu hřiště, dlouhých nákopech a přesvědčení, že každý odraz je součástí taktické přípravy.",
    seasonComment:
      "Letos chtějí ukázat, že i tým z pařezů může růst, pokud ho nikdo předčasně neokopne.",
  },
  {
    id: "tj_jiskra_vetrovy",
    slug: "tj-jiskra-vetrovy",
    name: "TJ Jiskra Větrovy",
    banner: "/banners/tj_jiskra_vetrovy.webp",
    note: "Hráči z kopce. Vítr jim přidává páté třetinky.",
    location: "Větrná aréna",
    colors: "žlutá a černá",
    motto: "Když fouká, hrajeme po větru.",
    description:
      "TJ Jiskra Větrovy je klub, který umí začít zápas v tempu, jako by ho hnala bouřka od západu.",
    seasonComment:
      "V sezoně jim nechybí nadšení ani pohyb, jen občas není jisté, jestli běží za míčem, nebo je prostě odnáší vítr.",
  },
  {
    id: "sokol_mokra_stran",
    slug: "sokol-mokra-stran",
    name: "Sokol Mokrá Stráň",
    banner: "/banners/sokol_mokra_stran.webp",
    note: "Hřiště mokré za každého počasí. Lajny volitelné.",
    location: "Hřiště Na Louži",
    colors: "modrá a zelená",
    motto: "Technika klouže, srdce drží.",
    description:
      "Sokol Mokrá Stráň má domácí hřiště, kde se technika s míčem rychle mění v boj o rovnováhu.",
    seasonComment:
      "Klub letos spoléhá na týmového ducha, pevné kolíky v kopačkách a víru, že déšť padá na obě mužstva stejně.",
  },
  {
    id: "sk_nove_drny",
    slug: "sk-nove-drny",
    name: "SK Nové Drny",
    banner: "/banners/sk_nove_drny.webp",
    note: "Nové drny, starý fotbal. Kombinace funguje.",
    location: "Stadion Nový pažit",
    colors: "zelená a bílá",
    motto: "Rosteme odspodu.",
    description:
      "SK Nové Drny je mladě působící tým, který se nebojí hrát odvážně, i když se míč občas rozhodne držet víc trávníku než plánu.",
    seasonComment:
      "V sezoně chtějí potvrdit, že nový drn nemusí být jen povrch, ale i začátek nové klubové éry.",
  },
  {
    id: "fk_zelena_mezna",
    slug: "fk-zelena-mezna",
    name: "FK Zelená Mezná",
    banner: "/banners/fk_zelena_mezna.webp",
    note: "Zelení z mezí. Barvy mají jednu výhodu — splývají s hřištěm.",
    location: "Hřiště Na Mezi",
    colors: "zelená a žlutá",
    motto: "Za čárou začíná náš presink.",
    description:
      "FK Zelená Mezná je klub z kraje, kde se fotbal hraje s výhledem do polí a s vědomím, že pro každý míč se někdo musí dojít.",
    seasonComment:
      "Letošní sezona je pro ně příležitost ukázat, že hranice hřiště nejsou hranice ambicí.",
  },
  {
    id: "tj_slavoj_brodek",
    slug: "tj-slavoj-brodek",
    name: "TJ Slavoj Brodek",
    banner: "/banners/tj_slavoj_brodek.webp",
    note: "Brodek má tradici. Trochu zaprášenou, ale tradici.",
    location: "Brodecký plácek",
    colors: "vínová a bílá",
    motto: "Když to nejde krásně, půjde to okresně.",
    description:
      "TJ Slavoj Brodek patří mezi týmy, které možná nepřekvapí rychlostí, ale umí soupeře unavit tím, že se pořád vrací do soubojů.",
    seasonComment:
      "Do sezony jdou s poctivostí, tvrdou prací a plánem, že když už se nedá vyhrát krásně, dá se vyhrát okresně.",
  },
  {
    id: "fc_kamenice",
    slug: "fc-kamenice",
    name: "FC Kamenice",
    banner: "/banners/fc_kamenice.webp",
    note: "Tvrdý tým. Tvrdé hřiště. Tvrdé míče.",
    location: "Kamenický stadionek",
    colors: "šedá a modrá",
    motto: "Tvrdě, jednoduše, bez zbytečných kudrlinek.",
    description:
      "FC Kamenice je tým pevný jako jeho název — občas nehybný, ale když se rozjede, těžko se zastavuje.",
    seasonComment:
      "V aktuální sezoně sází na jednoduchý fotbal, důraz v osobních soubojích a nadšení fanoušků, kteří už viděli horší věci než bezbrankovou remízu.",
  },
  {
    id: "tj_dynamo_loucany",
    slug: "tj-dynamo-loucany",
    name: "TJ Dynamo Loučany",
    banner: "/banners/tj_dynamo_loucany.webp",
    note: "Dynamo z Loučan. Energie přichází a odchází.",
    location: "Loučanská louka",
    colors: "oranžová a černá",
    motto: "Energie máme dost, góly doháníme.",
    description:
      "TJ Dynamo Loučany má v názvu energii a na hřišti snahu ji nějak proměnit v góly.",
    seasonComment:
      "Letos chtějí hrát aktivněji, odvážněji a pokud možno tak, aby se po zápase nemluvilo jen o občerstvení.",
  },
];

export function getClubBySlug(slug: string): Club | undefined {
  return CLUBS.find((c) => c.slug === slug);
}
