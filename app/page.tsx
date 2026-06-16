import Hero from "@/components/Hero";
import FeatureCard from "@/components/FeatureCard";
import QuoteStrip from "@/components/QuoteStrip";
import SiteFooter from "@/components/SiteFooter";

const STORY_POINTS = [
  "Začínáš v nejnižší okresní soutěži — tam, kde se hraje na hřišti u lesa.",
  "Náhoda FC nikdy neměl ambice. Ale pak přišel administrativní omyl, šťastný gól v 94. minutě a jeden hráč, který omylem nastoupil za správný tým.",
  "A teď jdeš nahoru. Nikdo neví proč. Ani ty.",
];

const FEATURES = [
  {
    icon: "⚽",
    title: "3 vs 3 arkádové zápasy",
    description: "Rychlé, přehledné a chaotické zápasy bez zbytečných komplikací.",
  },
  {
    icon: "🤖",
    title: "Jednoduchí boti",
    description: "Soupeři, kteří hrají fotbal přibližně tak dobře jako Náhoda FC.",
  },
  {
    icon: "🏆",
    title: "Kariéra od okresu nahoru",
    description: "Každá sezona tě posune o level výš. Nebo taky ne.",
  },
  {
    icon: "🌧️",
    title: "Venkovské hřiště, bahno, lajny orientační",
    description: "Autentické prostředí českého okresního fotbalu.",
  },
  {
    icon: "💬",
    title: "Hlášky a absurdní situace",
    description: "Protože bez hlášek z kabiny by to nebyla osmá liga.",
  },
];

export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* Příběhový blok */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Jak jsme se sem dostali
          </p>
          <div className="space-y-4">
            {STORY_POINTS.map((point, i) => (
              <div key={i} className="flex gap-4">
                <span className="mt-0.5 shrink-0 text-green-500">▸</span>
                <p className="text-sm leading-relaxed text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Co hra bude obsahovat
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      <QuoteStrip />
      <SiteFooter />
    </main>
  );
}
