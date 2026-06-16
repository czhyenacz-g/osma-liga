import Image from "next/image";
import Link from "next/link";

export default function MatchHero() {
  return (
    <section id="uvod" className="bg-gray-50 border-b border-gray-200">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">

        {/* Badge + soutěž */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-700 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
            Poslední utkání
          </span>
          <span className="text-xs text-gray-400">Osmá liga · neděle 14:00 · Za hasičárnou</span>
        </div>

        {/* Výsledkový panel */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm px-6 py-7 md:px-10">
          <div className="flex items-center justify-between gap-4">
            {/* Domácí */}
            <div className="flex flex-col items-center gap-2 text-center w-28 shrink-0">
              <Image
                src="/nahoda_banner.webp"
                alt="Náhoda FC"
                width={72}
                height={72}
                className="object-contain"
              />
              <span className="text-sm font-bold text-gray-800 leading-tight">Náhoda FC</span>
            </div>

            {/* Skóre */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900">
                12 <span className="text-green-700">:</span> 10
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Konečný výsledek
              </div>
            </div>

            {/* Hosté */}
            <div className="flex flex-col items-center gap-2 text-center w-28 shrink-0">
              <Image
                src="/banners/tj_sokol_tupoljany.webp"
                alt="TJ Sokol Tupoljany"
                width={72}
                height={72}
                className="object-contain"
              />
              <span className="text-sm font-bold text-gray-800 leading-tight">TJ Sokol Tupoljany</span>
            </div>
          </div>

          {/* Zpráva + citace */}
          <div className="mt-6 border-t border-gray-100 pt-5 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Domácí rozhodli zápas v závěru, kdy hosté reklamovali ofsajd, aut i samotnou existenci rozhodčího.
            </p>
            <blockquote className="rounded-lg bg-green-50 border-l-4 border-green-700 pl-4 pr-3 py-2.5">
              <p className="text-sm italic text-gray-700">
                &bdquo;Dvanáct branek doma bereme. Obranu doladíme, až budeme mít obránce.&ldquo;
              </p>
              <footer className="mt-1 text-xs font-semibold text-green-800">
                — Hynek Dařbujan, trenér Náhoda FC
              </footer>
            </blockquote>
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/hra"
              className="inline-flex items-center justify-center rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
            >
              Nastoupit k zápasu
            </Link>
            <a
              href="#kluby"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Zobrazit kluby
            </a>
          </div>
        </div>

        {/* Slogan */}
        <p className="mt-4 text-center text-xs text-gray-400 tracking-widest uppercase">
          VAR nemáme, hraj dál.
        </p>
      </div>
    </section>
  );
}
