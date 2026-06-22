import Link from 'next/link';
import { getClubStandings } from '@/lib/clubs';

const HOME_CLUB_SLUG = 'nahoda-fc';
const TOP_N = 5;

export default async function LeagueTable() {
  const { standings } = await getClubStandings();
  const top = standings.slice(0, TOP_N);

  return (
    <section id="vysledky" className="bg-white border-b border-gray-200 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <h2 className="text-xl font-black text-gray-900">Tabulka</h2>
          <Link href="/kluby" className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition">
            Celá tabulka →
          </Link>
        </div>

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
              {top.map((entry, i) => {
                const isHomeClub = entry.club.slug === HOME_CLUB_SLUG;
                return (
                  <tr
                    key={entry.club.id}
                    className={`border-b border-gray-100 last:border-0 ${
                      isHomeClub ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2.5 pl-4 text-gray-400 font-mono text-xs">{i + 1}.</td>
                    <td className={`py-2.5 px-2 font-semibold ${isHomeClub ? 'text-green-800' : 'text-gray-800'}`}>
                      {entry.club.shortName ?? entry.club.name}
                      {isHomeClub && (
                        <span className="ml-2 rounded bg-green-700 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                          Náš klub
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-bold text-gray-900">{entry.stats.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-400">
          O pořadí rozhodují body, skóre a další okresní okolnosti.
        </p>
      </div>
    </section>
  );
}
