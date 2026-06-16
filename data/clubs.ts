export interface Club {
  id: string;
  name: string;
  banner: string;
  note: string;
}

export const CLUBS: Club[] = [
  {
    id: "nahoda_fc",
    name: "Náhoda FC",
    banner: "/nahoda_banner.webp",
    note: "Klub, který nikdy neměl postoupit. Bohužel postoupil.",
  },
  {
    id: "tj_sokol_tupoljany",
    name: "TJ Sokol Tupoljany",
    banner: "/banners/tj_sokol_tupoljany.webp",
    note: "Soupeř z posledního utkání. Ještě pořád počítá góly.",
  },
  {
    id: "sk_dolni_lhota",
    name: "SK Dolní Lhota",
    banner: "/banners/sk_dolni_lhota.webp",
    note: "Solidní tým ze Lhoty. Lhoty je v kraji víc.",
  },
  {
    id: "fk_parezov",
    name: "FK Pařezov",
    banner: "/banners/fk_parezov.webp",
    note: "Tým, který bere domácí prostředí doslova.",
  },
  {
    id: "tj_jiskra_vetrovy",
    name: "TJ Jiskra Větrovy",
    banner: "/banners/tj_jiskra_vetrovy.webp",
    note: "Hráči z kopce. Vítr jim přidává páté třetinky.",
  },
  {
    id: "sokol_mokra_stran",
    name: "Sokol Mokrá Stráň",
    banner: "/banners/sokol_mokra_stran.webp",
    note: "Hřiště mokré za každého počasí. Lajny volitelné.",
  },
  {
    id: "sk_nove_drny",
    name: "SK Nové Drny",
    banner: "/banners/sk_nove_drny.webp",
    note: "Nové drny, starý fotbal. Kombinace funguje.",
  },
  {
    id: "fk_zelena_mezna",
    name: "FK Zelená Mezná",
    banner: "/banners/fk_zelena_mezna.webp",
    note: "Zelení z mezí. Barvy mají jednu výhodu — splývají s hřištěm.",
  },
  {
    id: "tj_slavoj_brodek",
    name: "TJ Slavoj Brodek",
    banner: "/banners/tj_slavoj_brodek.webp",
    note: "Brodek má tradici. Trochu zaprášenou, ale tradici.",
  },
  {
    id: "fc_kamenice",
    name: "FC Kamenice",
    banner: "/banners/fc_kamenice.webp",
    note: "Tvrdý tým. Tvrdé hřiště. Tvrdé míče.",
  },
  {
    id: "tj_dynamo_loucany",
    name: "TJ Dynamo Loučany",
    banner: "/banners/tj_dynamo_loucany.webp",
    note: "Dynamo z Loučan. Energie přichází a odchází.",
  },
];
