import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getClubs, getClubStandings } from "@/lib/clubs";
import LeagueHeader from "@/components/league/LeagueHeader";
import SiteFooter from "@/components/league/SiteFooter";
import { absoluteUrl, ogImageUrl } from "@/lib/seo";

const TITLE = "Kluby Osmé online ligy";
const DESCRIPTION =
  "Přehled fiktivních klubů Osmé online ligy, aktuální forma za posledních 30 dní, tabulka a klubové profily.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/kluby"),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/kluby"),
    images: [{ url: ogImageUrl(TITLE) }],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function KlubyPage() {
  const [clubs, { period, standings }] = await Promise.all([getClubs(), getClubStandings()]);

  return (
    <>
      <div
        style={{
          backgroundImage: "url(/top_background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }}
      >
        <LeagueHeader />
      </div>

      <main className="bg-white min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition">
              ← Zpět na úvod
            </Link>
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2">Kluby Osmé online ligy</h1>
          <p className="text-sm text-gray-500 mb-10 max-w-2xl">
            Jedenáct fiktivních okresních klubů, jeden míč a tolik ambicí, kolik dovolí stav
            trávníku. Osmá liga je zatím herní svět — kluby, tabulka i forma vznikají z online
            zápasů odehraných přímo tady na webu.
          </p>

          {/* Tabulka klubů */}
          <div className="mb-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wide">Tabulka klubů</h2>
              <p className="text-xs text-gray-400">
                {standings.every((e) => e.stats.points === 0)
                  ? 'Zatím se hraje o první body v posledních 30 dnech. Výbor čeká na zápis.'
                  : 'Aktuální forma za posledních 30 dní · Výhra 3 body · Remíza 1 · Prohra 0'}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 italic">
              Okresní sláva se musí pravidelně obhajovat.{' '}
              <span className="not-italic text-gray-300">Od {new Date(period.since).toLocaleDateString('cs-CZ')} do {new Date(period.until).toLocaleDateString('cs-CZ')}</span>
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm" style={{ minWidth: 520 }}>
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200" style={{ background: '#f9fafb' }}>
                    <th className="px-3 py-2.5 text-left w-8">#</th>
                    <th className="px-3 py-2.5 text-left">Klub</th>
                    <th className="px-3 py-2.5 text-center w-10" title="Zápasy">Z</th>
                    <th className="px-3 py-2.5 text-center w-10" title="Výhry">V</th>
                    <th className="px-3 py-2.5 text-center w-10" title="Remízy">R</th>
                    <th className="px-3 py-2.5 text-center w-10" title="Prohry">P</th>
                    <th className="px-3 py-2.5 text-center w-16" title="Skóre">Skóre</th>
                    <th className="px-3 py-2.5 text-center w-12" title="Rozdíl skóre">+/-</th>
                    <th className="px-3 py-2.5 text-center w-12" title="Body">Body</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, i) => {
                    const isFirst = i === 0 && entry.stats.points > 0;
                    return (
                      <tr
                        key={entry.club.id}
                        className="border-b border-gray-100 last:border-0 transition"
                        style={{ background: isFirst ? 'rgba(216,173,69,0.06)' : 'white' }}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Link
                            href={`/kluby/${entry.club.slug}`}
                            className="flex items-center gap-2 hover:opacity-75 transition"
                          >
                            {entry.club.bannerPath && (
                              <Image
                                src={entry.club.bannerPath}
                                alt={entry.club.name}
                                width={28}
                                height={28}
                                className="object-contain shrink-0"
                              />
                            )}
                            <span className="font-semibold text-gray-800 text-xs leading-snug">
                              {entry.club.shortName ?? entry.club.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 tabular-nums">{entry.stats.matches}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 tabular-nums">{entry.stats.wins}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 tabular-nums">{entry.stats.draws}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 tabular-nums">{entry.stats.losses}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-500 tabular-nums">{entry.stats.goalsFor}:{entry.stats.goalsAgainst}</td>
                        <td className="px-3 py-2.5 text-center text-xs tabular-nums" style={{ color: entry.stats.goalDifference > 0 ? '#16a34a' : entry.stats.goalDifference < 0 ? '#dc2626' : '#9ca3af' }}>
                          {entry.stats.goalDifference > 0 ? `+${entry.stats.goalDifference}` : entry.stats.goalDifference}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-sm font-black tabular-nums" style={{ color: entry.stats.points > 0 ? '#063f24' : '#d1d5db' }}>
                            {entry.stats.points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Klubové karty */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/kluby/${club.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center hover:border-green-300 hover:bg-green-50 transition"
              >
                <Image
                  src={club.banner}
                  alt={club.name}
                  width={72}
                  height={72}
                  className="object-contain"
                />
                <div className="text-xs font-bold text-gray-800 leading-snug">{club.name}</div>
                <div className="text-[10px] text-gray-500 leading-snug">{club.location}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
