import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getClubs } from "@/lib/clubs";
import LeagueHeader from "@/components/league/LeagueHeader";
import SiteFooter from "@/components/league/SiteFooter";

export const metadata: Metadata = {
  title: "Kluby Osmé ligy | Osmá liga",
  description:
    "Přehled klubů Osmé ligy — fiktivní okresní soutěže plné ambicí, odrazů a zápasů, které se jen tak nevzdávají.",
};

export default async function KlubyPage() {
  const clubs = await getClubs();
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

          <h1 className="text-2xl font-black text-gray-900 mb-2">Kluby Osmé ligy</h1>
          <p className="text-sm text-gray-500 mb-10 max-w-2xl">
            Jedenáct klubů, jeden míč a tolik ambicí, kolik dovolí stav trávníku. Osmá liga není
            jen soutěž — je to přehlídka týmů, které se odmítají vzdát, i když jim tabulka někdy
            naznačuje opak.
          </p>

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
