import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClubs, getClub, getClubStats } from "@/lib/clubs";
import LeagueHeader from "@/components/league/LeagueHeader";
import SiteFooter from "@/components/league/SiteFooter";
import { absoluteUrl, ogImageUrl } from "@/lib/seo";
import { formatPoints, formatMatches } from "@/lib/format";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const clubs = await getClubs();
  return clubs.map((club) => ({ slug: club.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) return {};

  const fullTitle = `${club.name} | Osmá liga`;
  const description = (
    club.description
      ? `${club.description} ${club.seasonComment}`.trim()
      : `Profil klubu ${club.name} v Osmé lize. Aktuální forma, nejlepší hráči a možnost zahrát si za klub online.`
  ).slice(0, 160);
  const url = absoluteUrl(`/kluby/${club.slug}`);

  return {
    title: club.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      images: [{ url: club.banner || ogImageUrl(club.name) }],
    },
    twitter: {
      title: fullTitle,
      description,
    },
  };
}

export default async function ClubDetailPage({ params }: Props) {
  const { slug } = await params;
  const [club, clubData] = await Promise.all([getClub(slug), getClubStats(slug)]);
  if (!club) notFound();
  const { period, stats, topPlayers } = clubData;

  const isNahoda = club.slug === "nahoda-fc";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${club.name} | Osmá liga`,
    url: absoluteUrl(`/kluby/${club.slug}`),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        <div className="mx-auto max-w-3xl px-4 py-12">
          {/* Breadcrumb */}
          <div className="mb-6 text-xs text-gray-400 flex flex-wrap gap-2 items-center">
            <Link href="/" className="hover:text-gray-600 transition">Úvod</Link>
            <span>›</span>
            <Link href="/kluby" className="hover:text-gray-600 transition">Kluby</Link>
            <span>›</span>
            <span className="text-gray-600">{club.name}</span>
          </div>

          {/* Hlavička klubu */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
            <Image
              src={club.banner}
              alt={club.name}
              width={96}
              height={96}
              className="object-contain shrink-0 drop-shadow-md"
            />
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">
                {club.name}
              </h1>
              <p className="text-sm text-gray-500">{club.location}</p>
              <p
                className="text-xs font-semibold mt-2 italic"
                style={{ color: "#2d6a4f" }}
              >
                &bdquo;{club.motto}&ldquo;
              </p>
            </div>
          </div>

          {/* Karta — základní info */}
          <div
            className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-6 grid grid-cols-2 gap-4 text-sm"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Barvy
              </p>
              <p className="text-gray-800">{club.colors}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Hřiště
              </p>
              <p className="text-gray-800">{club.location}</p>
            </div>
          </div>

          {/* Medailonek */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              O klubu
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">{club.description}</p>
          </div>

          {/* Sezóna */}
          <div
            className="rounded-xl px-6 py-5 mb-8"
            style={{
              background: "linear-gradient(135deg, #063f24 0%, #052e1a 100%)",
              border: "1px solid rgba(216,173,69,0.22)",
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#d8ad45" }}>
              Aktuální sezona
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(209,250,229,0.85)" }}>
              {club.seasonComment}
            </p>
          </div>

          {/* Trenérský koutek — pouze Náhoda FC */}
          {isNahoda && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 mb-8">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
                Trenérský koutek
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fotka trenéra se připravuje. Zatím se tým řídí heslem:{" "}
                <span className="font-semibold text-gray-800">VAR nemáme, hraj dál.</span>
              </p>
            </div>
          )}

          {/* Statistiky klubu */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 mb-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                Statistiky za posledních 30 dní
              </h2>
              <span className="text-[10px] text-gray-300">
                {new Date(period.since).toLocaleDateString('cs-CZ')} – {new Date(period.until).toLocaleDateString('cs-CZ')}
              </span>
            </div>
            {stats.matches === 0 ? (
              <p className="text-sm text-gray-500">Klub zatím nemá odehraný online zápas za posledních 30 dní.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <StatRow label="Zápasy" value={String(stats.matches)} />
                <StatRow label="Body" value={String(stats.points)} highlight />
                <StatRow label="Výhry" value={String(stats.wins)} />
                <StatRow label="Remízy" value={String(stats.draws)} />
                <StatRow label="Prohry" value={String(stats.losses)} />
                <StatRow label="Skóre" value={`${stats.goalsFor}:${stats.goalsAgainst}`} />
                <StatRow label="Rozdíl skóre" value={stats.goalDifference >= 0 ? `+${stats.goalDifference}` : String(stats.goalDifference)} />
              </div>
            )}
          </div>

          {/* Nejlepší hráči */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
              Nejlepší hráči za posledních 30 dní
            </h2>
            {topPlayers.length === 0 ? (
              <p className="text-sm text-gray-500">Klub zatím nemá žádného přihlášeného hráče v online zápasech za posledních 30 dní.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {topPlayers.map((player, i) => {
                  const name = player.globalName ?? player.username;
                  return (
                    <li key={player.userId} className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300 w-4 shrink-0">{i + 1}.</span>
                      {player.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.avatarUrl} alt="" width={28} height={28} className="rounded-full shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-gray-400">{name[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-bold text-gray-800 truncate">{name}</span>
                        <span className="text-xs text-gray-500">
                          {formatPoints(player.points)} · {formatMatches(player.matches)} · {player.wins} {player.wins === 1 ? 'výhra' : player.wins >= 2 && player.wins <= 4 ? 'výhry' : 'výher'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href={`/satna?club=${club.slug}`}
              className="inline-block rounded-lg px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
              style={{ background: "#063f24", color: "#fff" }}
            >
              Hrát za {club.name}
            </Link>
            <Link
              href="/kluby"
              className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:opacity-80"
              style={{ color: "#6b7280" }}
            >
              ← Všechny kluby
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-bold tabular-nums ${highlight ? 'text-gray-900 text-base' : 'text-gray-800 text-sm'}`}>
        {value}
      </span>
    </div>
  );
}
