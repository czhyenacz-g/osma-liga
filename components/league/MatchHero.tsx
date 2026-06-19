"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MissingMatchReportModal from "@/components/MissingMatchReportModal";
import type { ActiveChallenge } from "@/lib/game/activeChallenge";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6z" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14.5" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l4-3h2a3 3 0 0 0 6 0h2l4 3-2.5 3L17 8v11H7V8L4.5 9 3 6z" />
    </svg>
  );
}

export default function MatchHero({ challenge }: { challenge?: ActiveChallenge }) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <section
      id="uvod"
      className="relative"
    >
      {/* Tmavý overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16 xl:gap-24">

          {/* ── LEVÁ ČÁST: poslední utkání ── */}
          <div className="flex-1 min-w-0 text-white space-y-5">
            <div className="max-w-[720px] space-y-5">

              {/* Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-600/90 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-white">
                  Poslední utkání
                </span>
                <span className="text-xs text-white/50">Osmá liga · neděle 14:00 · Hřiště za hasičárnou</span>
              </div>

              {/* Scoreboard */}
              <div className="grid items-center text-center" style={{ gridTemplateColumns: "minmax(72px, 140px) 1fr minmax(72px, 140px)" }}>
                {/* Domácí */}
                <div className="flex flex-col items-center gap-1.5">
                  <Image src="/nahoda_banner.webp" alt="Náhoda FC" width={72} height={72} className="object-contain drop-shadow-lg" />
                  <span className="text-xs font-bold text-white/90 leading-tight">Náhoda FC</span>
                </div>

                {/* Skóre */}
                <div>
                  <div className="font-black leading-none text-white whitespace-nowrap" style={{ fontSize: "clamp(36px, 9vw, 76px)", letterSpacing: "-0.03em" }}>
                    12 <span style={{ color: "#d6a94a" }}>:</span> 10
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 whitespace-nowrap">
                    Konečný výsledek
                  </div>
                </div>

                {/* Hosté */}
                <div className="flex flex-col items-center gap-1.5">
                  <Image src="/banners/tj_sokol_tupoljany.webp" alt="TJ Sokol Tupoljany" width={72} height={72} className="object-contain drop-shadow-lg" />
                  <span className="text-xs font-bold text-white/90 leading-tight">TJ Sokol Tupoljany</span>
                </div>
              </div>

              {/* Report */}
              <p className="text-sm text-white/70 leading-relaxed">
                Domácí rozhodli zápas v závěru, kdy hosté reklamovali ofsajd, aut i samotnou existenci rozhodčího.
              </p>

              {/* Citace */}
              <blockquote className="rounded-xl bg-black/35 border-l-4 px-4 py-3" style={{ borderColor: "#d6a94a" }}>
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
                  href="/satna"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#d6a94a", color: "#052e1a" }}
                >
                  Hrát fotbal online
                </Link>
                <a
                  href="#kluby"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Zobrazit kluby
                </a>
              </div>

            </div>
          </div>

          {/* Svislá linka — desktop */}
          <div className="hidden lg:block w-px self-stretch bg-white/10 shrink-0" />

          {/* ── PRAVÁ KARTA: příští zápas / aktivní výzva ── */}
          <div
            className="w-full lg:w-[360px] shrink-0 rounded-2xl bg-white shadow-2xl overflow-hidden mt-8 lg:mt-0"
            style={
              challenge
                ? { border: "2px solid #d6a94a", boxShadow: "0 0 28px rgba(214,169,74,0.3)" }
                : undefined
            }
          >
            {challenge?.type === "human" ? (
              <>
                <div className="px-5 py-3" style={{ background: "#052e1a" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Online zápas čeká
                  </p>
                </div>
                <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Někdo vyvěsil výzvu na návsi.
                    <br />
                    Kdo klikne první, jde na plac.
                  </p>
                  <Link
                    href={`/hra/online/${challenge.code}`}
                    className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest text-center transition hover:opacity-90"
                    style={{ background: "#d6a94a", color: "#052e1a" }}
                  >
                    Přidat se k zápasu
                  </Link>
                </div>
              </>
            ) : challenge?.type === "training" ? (
              <>
                <div className="px-5 py-3" style={{ background: "#052e1a" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Tréninkový zápas čeká
                  </p>
                </div>
                <div className="px-5 py-8 flex flex-col items-center gap-4 text-center">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {challenge.message}
                    <br />
                    Kdo klikne první, jde na plac.
                  </p>
                  <Link
                    href={`/hra/online/${challenge.code}`}
                    className="w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest text-center transition hover:opacity-90"
                    style={{ background: "#d6a94a", color: "#052e1a" }}
                  >
                    Nastoupit proti nim
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="px-5 py-3" style={{ background: "#052e1a" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    Příští zápas
                  </p>
                </div>

                <div className="px-5 py-5 space-y-4">
                  {/* Loga + vs */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <Image src="/nahoda_banner.webp" alt="Náhoda FC" width={56} height={56} className="object-contain" />
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">Náhoda FC</span>
                    </div>
                    <span className="text-lg font-black text-gray-300">vs.</span>
                    <div className="flex flex-col items-center gap-1">
                      <Image src="/banners/fk_parezov.webp" alt="FK Pařezov" width={56} height={56} className="object-contain" />
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">FK Pařezov</span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CalendarIcon className="shrink-0 h-4 w-4 text-emerald-800 mt-0.5" />
                      <span className="text-xs text-gray-600 leading-snug">neděle 14:00</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPinIcon className="shrink-0 h-4 w-4 text-emerald-800 mt-0.5" />
                      <span className="text-xs text-gray-600 leading-snug">Hřiště za hasičárnou</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ClockIcon className="shrink-0 h-4 w-4 text-emerald-800 mt-0.5" />
                      <span className="text-xs text-gray-600 leading-snug">Sraz: 13:20</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShirtIcon className="shrink-0 h-4 w-4 text-emerald-800 mt-0.5" />
                      <span className="text-xs text-gray-600 leading-snug">Dresy: bere ten, kdo je najde</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="w-full rounded-xl border-2 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-gray-50"
                    style={{ borderColor: "#052e1a", color: "#052e1a" }}
                  >
                    Více o zápase
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      <MissingMatchReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </section>
  );
}
