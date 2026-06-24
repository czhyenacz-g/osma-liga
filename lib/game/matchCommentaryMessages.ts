export const firstGoalMessages = [
  'Tohle už vypadá jako fotbal. Skoro.',
  'Výbor si poznamenal, že tam byl náznak kombinace.',
  'Míč se pohnul správným směrem. To se počítá.',
  'Na okresní poměry velmi odvážné řešení.',
  'Trenér na lavičce právě přestal na chvíli křičet.',
  'Takhle nějak to prý dělají i ve vyšších soutěžích.',
  'Soupeř neví, jestli bránit, nebo podat protest.',
  'Tohle by v zápise vypadalo lépe než ve skutečnosti.',
  'Diváci u zábradlí ocenili snahu. Jeden dokonce kývl.',
  'Fotbalová myšlenka tam byla. Provedení řeší disciplinárka.',
  'Hlavně nezapomeň, kdo měl dneska vyhrát.',
  'Gól platí. Rozhodčí se díval zrovna tím správným směrem.',
  'Brankář protestuje, výbor zapisuje, hospoda slaví.',
  'Tohle byla akce tak čistá, až je to podezřelé.',
  'Někdo na tribuně právě změnil názor na spravedlnost.',
];

export const fullTimeMessages = [
  'Konec zápasu. Výbor se tváří, že přesně takhle to plánoval.',
  'Dohráno. Zápis bude hotový, jakmile se shodnou pamětníci.',
  'Rozhodčí pískl konec a okamžitě zmizel směrem k bufetu.',
  'Tři body jsou doma. Nebo aspoň někde poblíž.',
  'Zápas skončil. Teď už zbývá jen najít míč a viníka.',
  'Hráči odcházejí, emoce zůstávají, trávník to přežil.',
  'Výsledek platí. Námitky přijímá výbor každé liché úterý.',
  'Konec. Kdo dneska vyhrál, ukáže tabulka. Kdo měl vyhrát, ví jen pár lidí.',
  'Delegát utkání nic neviděl. Takže všechno v pořádku.',
  'Zápis je podepsaný. Některé podpisy vypadají jistěji než výkon rozhodčího.',
  'Hotovo. Fanoušci se rozcházejí s pocitem, že byli u něčeho těžko popsatelného.',
  'Okresní fotbal dnes znovu prokázal, že fyzika je jen doporučení.',
];

// Random substitution toast — kept short so it doesn't crowd the pitch.
export const substitutionMessages = [
  'Střídání! Někdo jde na lavičku přemýšlet o životě.',
  'Střídání! Chvilka oddechu se počítá.',
  'Střídání! Lavička volá.',
  'Střídání! Za chvíli zpátky, nikam nespěchej.',
  'Střídání! I okresní hvězdy potřebují pauzu.',
  'Střídání! Vrátí se, jen co vychladne.',
];

// Shown under the main goal message to whichever connected player just
// conceded — perspective-dependent, so picked client-side (see
// OnlineGameCanvas.tsx), not baked into the shared server snapshot.
export const concededGoalMessages = [
  'Ale dali gól tobě.',
  'Hele… gól to byl krásnej. Škoda, že do tvojí brány.',
  'Tohle nebyla obrana. To byla komentovaná prohlídka trávníku.',
  'Brankář se tváří, že to bylo mimo jeho pracovní dobu.',
  'Na lavičce se právě někdo přestal smát.',
  'Soupeř děkuje za volný průchod.',
  'Tohle si obrana za rámeček nedá.',
  'Trenér právě objevil nové vrásky.',
  'Výčep na tribuně ztichl. Na dvě vteřiny.',
  'Tady se někdo zapomněl vrátit z klobásy.',
];

export function pickRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}
