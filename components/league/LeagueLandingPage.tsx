import Link from "next/link";
import LeagueHeader from "@/components/league/LeagueHeader";
import SiteFooter from "@/components/league/SiteFooter";
import { LEAGUE_LANDING_PAGES, type LeagueLandingPage } from "@/lib/leagueLandingPages";

export default function LeagueLandingPageView({ league }: { league: LeagueLandingPage }) {
  const otherLeagues = LEAGUE_LANDING_PAGES.filter((l) => l.slug !== league.slug);

  return (
    <>
      <div
        style={{
          backgroundImage: "url(/top_background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }}
      >
        <LeagueHeader compact />
      </div>

      <main className="bg-white min-h-screen">
        <div className="mx-auto max-w-3xl px-6 py-14">
          {/* Hero */}
          <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
            {league.heroTitle}
          </h1>
          <p className="text-base text-gray-500 mb-8 leading-relaxed">
            {league.heroSubtitle}
          </p>

          {/* Intro */}
          <p className="text-sm text-gray-600 mb-12 leading-relaxed max-w-2xl">
            {league.intro}
          </p>

          {/* Block 1 — zápasy a výsledky */}
          <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-2">
              Zápasy a výsledky
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {league.matchesPlaceholder}
            </p>
          </section>

          {/* Block 2 — kurzy, tipy a partneři */}
          <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-2">
              Kurzy, tipy a partneři
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {league.oddsPlaceholder}
            </p>
          </section>

          {/* Block 3 — CTA do hlavního světa */}
          <section
            className="mb-10 rounded-xl p-6 text-center"
            style={{ background: "#052e1a" }}
          >
            <h2 className="text-sm font-black uppercase tracking-wide text-white mb-3">
              Vstup do světa Osmé ligy
            </h2>
            <Link
              href="/"
              className="inline-block rounded-lg px-6 py-3 text-sm font-bold transition hover:opacity-90"
              style={{ background: "#d6a94a", color: "#052e1a" }}
            >
              {league.ctaText}
            </Link>
          </section>

          {/* Odkazy na ostatní ligové stránky */}
          <section className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">
              Další ligové úrovně
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherLeagues.map((l) => (
                <Link
                  key={l.slug}
                  href={`/${l.slug}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-green-300 hover:text-green-800"
                >
                  {l.displayName}
                </Link>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <p className="text-[11px] text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
            Osmá liga je fanouškovský a herní projekt. Není oficiálním webem žádné fotbalové soutěže.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
