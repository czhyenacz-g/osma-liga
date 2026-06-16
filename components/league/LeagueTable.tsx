const TABLE = [
  { pos: 1, name: "FK Pařezov",        pts: 12 },
  { pos: 2, name: "Náhoda FC",         pts: 10, highlight: true },
  { pos: 3, name: "FC Kamenice",       pts: 9  },
  { pos: 4, name: "SK Dolní Lhota",    pts: 8  },
  { pos: 5, name: "TJ Sokol Tupoljany", pts: 7 },
];

export default function LeagueTable() {
  return (
    <section id="vysledky" className="bg-white border-b border-gray-200 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-xl font-black text-gray-900 mb-6">Tabulka</h2>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-2.5 pl-4 text-left w-8">#</th>
                <th className="py-2.5 px-2 text-left">Klub</th>
                <th className="py-2.5 pr-4 text-right">Body</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map((row) => (
                <tr
                  key={row.pos}
                  className={`border-b border-gray-100 last:border-0 ${
                    row.highlight ? "bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-2.5 pl-4 text-gray-400 font-mono text-xs">{row.pos}.</td>
                  <td className={`py-2.5 px-2 font-semibold ${row.highlight ? "text-green-800" : "text-gray-800"}`}>
                    {row.name}
                    {row.highlight && (
                      <span className="ml-2 rounded bg-green-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                        Náš klub
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-bold text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-400">
          O pořadí rozhoduje skóre, docházka a čitelnost zápisu.
        </p>
      </div>
    </section>
  );
}
