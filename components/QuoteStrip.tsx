const QUOTES = [
  "VAR nemáme, hraj dál.",
  "Hrajeme v devíti. Ale jeden z nich má auto.",
  "Lajny jsou orientační.",
  "Soupeř má jedenáct lidí. Frajeři.",
  "Níže už je jen nohejbal u hospody.",
];

export default function QuoteStrip() {
  return (
    <section className="border-y border-slate-700/50 bg-slate-800/30 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Z kabiny Náhoda FC
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUOTES.map((quote, i) => (
            <blockquote
              key={i}
              className="rounded-xl border border-slate-700/40 bg-slate-900/60 px-4 py-3 text-sm font-medium italic text-slate-300"
            >
              &bdquo;{quote}&ldquo;
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
