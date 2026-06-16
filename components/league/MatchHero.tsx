import Image from "next/image";
import Link from "next/link";

export default function MatchHero() {
  return (
    <section
      id="uvod"
      className="relative"
      style={{ backgroundImage: "url(/top_background.webp)", backgroundSize: "cover", backgroundPosition: "center top" }}
    >
      {/* Tmavý overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />

      <div className="relative mx-auto max-w-[1240px] px-6 py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">

          {/* ── LEVÁ ČÁST: poslední utkání ── */}
          <div className="text-white space-y-5">
            {/* Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-600/90 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
                Poslední utkání
              </span>
              <span className="text-xs text-white/50">Osmá liga · neděle 14:00 · Hřiště za hasičárnou</span>
            </div>

            {/* Výsledek */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-1.5 w-20 sm:w-24 shrink-0">
                <Image
                  src="/nahoda_banner.webp"
                  alt="Náhoda FC"
                  width={72}
                  height={72}
                  className="object-contain drop-shadow-lg"
                />
                <span className="text-xs font-bold text-white/90 text-center leading-tight">Náhoda FC</span>
              </div>

              <div className="flex-1 text-center">
                <div
                  className="font-black leading-none text-white"
                  style={{ fontSize: "clamp(48px, 8vw, 80px)", letterSpacing: "-0.03em" }}
                >
                  12 <span style={{ color: "#d6a94a" }}>:</span> 10
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Konečný výsledek
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 w-20 sm:w-24 shrink-0">
                <Image
                  src="/banners/tj_sokol_tupoljany.webp"
                  alt="TJ Sokol Tupoljany"
                  width={72}
                  height={72}
                  className="object-contain drop-shadow-lg"
                />
                <span className="text-xs font-bold text-white/90 text-center leading-tight">TJ Sokol Tupoljany</span>
              </div>
            </div>

            {/* Report */}
            <p className="text-sm text-white/70 leading-relaxed max-w-lg">
              Domácí rozhodli zápas v závěru, kdy hosté reklamovali ofsajd, aut i samotnou existenci rozhodčího.
            </p>

            {/* Citace */}
            <blockquote className="rounded-xl bg-black/35 border-l-4 px-4 py-3 max-w-lg" style={{ borderColor: "#d6a94a" }}>
              <p className="text-sm italic text-white/85">
                &bdquo;Dvanáct branek doma bereme. Obranu doladíme, až budeme mít obránce.&ldquo;
              </p>
              <footer className="mt-1.5 text-xs font-semibold" style={{ color: "#d6a94a" }}>
                — Hynek Dařbujan, trenér Náhoda FC
              </footer>
            </blockquote>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                href="/hra"
                className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#d6a94a", color: "#052e1a" }}
              >
                Nastoupit k zápasu
              </Link>
              <a
                href="#kluby"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                Zobrazit kluby
              </a>
            </div>
          </div>

          {/* ── PRAVÁ KARTA: příští zápas ── */}
          <div className="rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header karty */}
            <div className="px-5 py-3" style={{ background: "#052e1a" }}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Příští zápas
              </p>
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Loga + vs */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/nahoda_banner.webp"
                    alt="Náhoda FC"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                  <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">Náhoda FC</span>
                </div>

                <span className="text-lg font-black text-gray-300">vs.</span>

                <div className="flex flex-col items-center gap-1">
                  <Image
                    src="/banners/fk_parezov.webp"
                    alt="FK Pařezov"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                  <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">FK Pařezov</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Detail */}
              <ul className="space-y-1.5 text-sm text-gray-700">
                {[
                  ["📅", "neděle 14:00"],
                  ["📍", "Hřiště za hasičárnou"],
                  ["🕐", "Sraz: 13:20"],
                  ["👕", "Dresy: bere ten, kdo je najde"],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-2">
                    <span className="shrink-0 text-base leading-snug">{icon}</span>
                    <span className="leading-snug text-xs text-gray-600">{text}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                type="button"
                className="w-full rounded-xl border-2 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-gray-50"
                style={{ borderColor: "#052e1a", color: "#052e1a" }}
              >
                Více o zápase
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
