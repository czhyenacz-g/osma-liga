export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-green-950 via-slate-900 to-slate-900">
      {/* Hřiště — CSS dekorace */}
      <div className="pointer-events-none absolute inset-0">
        {/* Středový kruh */}
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        {/* Středový bod */}
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        {/* Středová linie */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/[0.04]" />
        {/* Horní pokutové území */}
        <div className="absolute left-1/2 top-0 h-28 w-56 -translate-x-1/2 border-b border-l border-r border-white/[0.06]" />
        {/* Dolní pokutové území */}
        <div className="absolute bottom-0 left-1/2 h-28 w-56 -translate-x-1/2 border-l border-r border-t border-white/[0.06]" />
        {/* Zelená textura — jemný gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(21,128,61,0.15)_0%,_transparent_60%)]" />
      </div>

      {/* Obsah */}
      <div className="relative z-10 px-4 text-center">
        {/* Badge */}
        <div className="mb-5 inline-block rounded-full border border-green-600/30 bg-green-900/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-green-400">
          Náhoda FC uvádí
        </div>

        {/* Název */}
        <h1 className="mb-3 text-6xl font-black tracking-tight text-white md:text-8xl">
          Osmá liga
        </h1>

        {/* Slogan */}
        <p className="mb-3 text-lg font-medium text-green-300 md:text-xl">
          VAR nemáme, hraj dál.
        </p>

        {/* Popis */}
        <p className="mx-auto mb-10 max-w-sm text-sm text-slate-400 md:text-base">
          Arkádový okresní fotbal o týmu, který nikdy neměl postoupit.
          Bohužel postoupil.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button className="w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-500 sm:w-auto">
            Nastoupit k zápasu
          </button>
          <button className="w-full rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 sm:w-auto">
            Zjistit, proč jsme postoupili
          </button>
        </div>

        {/* Lajny pod CTA */}
        <div className="mx-auto mt-12 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">
          <span className="h-px w-8 bg-white/20" />
          Lajny jsou orientační
          <span className="h-px w-8 bg-white/20" />
        </div>
      </div>
    </section>
  );
}
