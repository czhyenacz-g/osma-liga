const NEWS = [
  {
    title: "Náhoda FC bere tři body po výsledku 12:10",
    body: "Zápis o utkání se podařilo podepsat dřív, než si hosté všimli skóre.",
    date: "Ne 15. 6.",
    tag: "Výsledky",
  },
  {
    title: "Nominace na neděli: potvrzeno zatím devět hráčů",
    body: "Trenér Dařbujan věří, že do výkopu se objeví ještě někdo s kopačkami.",
    date: "Pá 13. 6.",
    tag: "Tým",
  },
  {
    title: "Klub hledá nové hráče do pole i k lajně",
    body: "Technika výhodou, docházka zázrakem. Nábor bude spuštěn v další verzi webu.",
    date: "St 11. 6.",
    tag: "Nábor",
  },
];

export default function NewsSection() {
  return (
    <section id="aktuality" className="bg-gray-50 border-b border-gray-200 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-xl font-black text-gray-900 mb-6">Aktuality</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((item, i) => (
            <article
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-2 hover:border-green-300 transition"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800">
                  {item.tag}
                </span>
                <span className="text-[10px] text-gray-400">{item.date}</span>
              </div>
              <h3 className="text-sm font-bold text-gray-900 leading-snug">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
