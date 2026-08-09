import Image from "next/image";
import Link from "next/link";
import AuthStatus from "@/components/auth/AuthStatus";
import { CLUBS } from "@/data/clubs";

const TEASER_CLUBS = CLUBS.slice(0, 6);

const FEATURES = [
  {
    title: "Vyber si klub",
    text: "Hraj za jeden z okresních klubů.",
    icon: ShieldIcon,
  },
  {
    title: "Hraj zápasy",
    text: "Proti počítači nebo proti hráčům.",
    icon: BallIcon,
  },
  {
    title: "Soutěž a postupuj",
    text: "Získej body, bojuj o titul a piš historii klubu.",
    icon: TrophyIcon,
  },
  {
    title: "Sleduj ligu",
    text: "Výsledky, tabulky, aktuality a okresní atmosféra.",
    icon: TableIcon,
  },
];

export default function ComingSoonHome() {
  return (
    <div
      className="relative flex min-h-screen flex-col text-white"
      style={{
        backgroundImage: "url(/top_background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      {/* Vinětový overlay — tmavší uprostřed pro čitelnost, tribuny po stranách vidět */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(3,17,10,0.6) 0%, rgba(4,26,15,0.5) 35%, rgba(3,17,10,0.72) 75%, rgba(2,12,7,0.88) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 38%, rgba(2,14,8,0.55) 0%, rgba(2,14,8,0) 70%)",
        }}
      />

      <Header />

      <main className="relative flex flex-1 flex-col items-center px-4 pb-14 pt-10 sm:pt-14 text-center">
        <Hero />
        <DateBlock />
        <Claim />
        <ClubRow />
        <FeatureStrip />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header
      className="relative shrink-0"
      style={{ borderBottom: "1px solid rgba(216,173,69,0.16)", background: "rgba(3,17,10,0.35)" }}
    >
      <div
        className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 py-3"
        style={{ minHeight: "80px" }}
      >
        <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-90 transition">
          <Image
            src="/nahoda_banner.webp"
            alt="Náhoda FC"
            width={64}
            height={64}
            className="object-contain drop-shadow-lg"
            style={{ width: 64, height: 64 }}
          />
          <div className="min-w-0 text-left">
            <div
              className="font-extrabold leading-none text-white"
              style={{ fontSize: "clamp(18px, 2.6vw, 28px)", letterSpacing: "-0.01em" }}
            >
              Osmá liga
            </div>
            <div
              className="mt-1 font-semibold uppercase tracking-[0.18em]"
              style={{ fontSize: "10px", color: "#8fbf9a" }}
            >
              Okresní fotbal. Až moc vážně.
            </div>
          </div>
        </Link>

        <AuthStatus />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center pt-4 pb-6">
      {/* Dekorativní míč + zlaté linky */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5">
        <span className="h-px w-10 sm:w-16" style={{ background: "linear-gradient(to right, transparent, #d8ad45)" }} />
        <BallGlyph />
        <span className="h-px w-10 sm:w-16" style={{ background: "linear-gradient(to left, transparent, #d8ad45)" }} />
      </div>

      <h1
        className="font-extrabold uppercase"
        style={{
          fontSize: "clamp(34px, 8vw, 84px)",
          letterSpacing: "-0.01em",
          lineHeight: 1.05,
        }}
      >
        <span
          className="block"
          style={{ color: "#eef3ef", textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5)" }}
        >
          Osmá liga
        </span>
        <span
          className="block"
          style={{ color: "#e3b94f", textShadow: "0 2px 26px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.55)" }}
        >
          se připravuje
        </span>
      </h1>

      {/* Zlatý divider s jemným glow bodem */}
      <div className="relative mt-7 flex items-center justify-center">
        <span
          className="h-px w-40 sm:w-56"
          style={{ background: "linear-gradient(to right, transparent, #d8ad45 50%, transparent)" }}
        />
        <span
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ background: "#f0c75e", boxShadow: "0 0 10px 3px rgba(240,199,94,0.55)" }}
        />
      </div>
    </div>
  );
}

function DateBlock() {
  return (
    <div className="mt-8">
      <p
        className="font-semibold uppercase tracking-[0.2em] text-white/85"
        style={{ fontSize: "clamp(13px, 1.8vw, 16px)", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
      >
        Nová sezóna začíná
      </p>
      <p
        className="mt-2 font-extrabold uppercase"
        style={{
          fontSize: "clamp(26px, 5vw, 44px)",
          color: "#e3b94f",
          letterSpacing: "-0.01em",
          textShadow: "0 2px 18px rgba(0,0,0,0.6)",
        }}
      >
        1. září 2026
      </p>
    </div>
  );
}

function Claim() {
  return (
    <p
      className="mt-6 text-white/80"
      style={{ fontSize: "clamp(14px, 1.6vw, 18px)", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
    >
      Vyber si klub. Vlez na hřiště.
    </p>
  );
}

function ClubRow() {
  return (
    <div className="mt-10 w-full max-w-4xl">
      <div className="grid grid-cols-3 gap-x-6 gap-y-5 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-10 sm:gap-y-4">
        {TEASER_CLUBS.map((club) => (
          <div key={club.id} className="flex items-center justify-center" title={club.name}>
            <Image
              src={club.banner}
              alt={club.name}
              width={52}
              height={52}
              className="object-contain opacity-85 drop-shadow-md transition hover:opacity-100 hover:-translate-y-0.5"
              style={{ width: "clamp(40px, 6vw, 52px)", height: "clamp(40px, 6vw, 52px)" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureStrip() {
  return (
    <div
      className="mt-12 w-full max-w-5xl rounded-xl px-4 py-6 sm:px-8 sm:py-7"
      style={{
        background: "rgba(3,17,10,0.55)",
        border: "1px solid rgba(216,173,69,0.18)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-0">
        {FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-2 px-2 text-center sm:px-4"
              style={
                i > 0
                  ? { borderLeft: "1px solid rgba(216,173,69,0.14)" }
                  : undefined
              }
            >
              <Icon />
              <div
                className="font-bold uppercase tracking-[0.08em]"
                style={{ fontSize: "12px", color: "#e3b94f" }}
              >
                {feature.title}
              </div>
              <p className="text-xs leading-snug text-white/60">{feature.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="relative shrink-0 px-4 py-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(2,12,7,0.5)" }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between text-[11px]" style={{ color: "rgba(209,250,229,0.4)" }}>
        <span>© 2026 Osmá liga</span>
        <span>Nová sezóna 2026</span>
      </div>
    </footer>
  );
}

function BallGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="9.5" stroke="#d8ad45" strokeWidth="1.3" />
      <path
        d="M12 7.2 15.6 9.8 14.2 14 9.8 14 8.4 9.8 12 7.2Z"
        stroke="#d8ad45"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M12 2.5v4.7M12 21.5v-4.5M3.2 9l4.4 1M20.8 9l-4.4 1M5 18.2l3.6-4M19 18.2l-3.6-4" stroke="#d8ad45" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 4.5 5.5v5.2c0 4.6 3.1 8.4 7.5 9.8 4.4-1.4 7.5-5.2 7.5-9.8V5.5L12 3Z"
        stroke="#d8ad45"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M9 12.2 11 14.2 15.3 9.8" stroke="#d8ad45" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4h10v4.2A5 5 0 0 1 12 13.2 5 5 0 0 1 7 8.2V4Z"
        stroke="#d8ad45"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7 5.5H4.5v1.2A3.5 3.5 0 0 0 8 10M17 5.5h2.5v1.2A3.5 3.5 0 0 1 16 10" stroke="#d8ad45" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 13.2v3.3M9 20h6M10 20v-2.3c0-.6.5-1.2 1.2-1.2h1.6c.7 0 1.2.6 1.2 1.2V20" stroke="#d8ad45" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BallIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.3" stroke="#d8ad45" strokeWidth="1.4" />
      <path
        d="M12 7.6 15.3 9.9 14 13.8 10 13.8 8.7 9.9 12 7.6Z"
        stroke="#d8ad45"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M12 3.7v3.9M4.3 8.8l3.9.9M6.6 17.4l3-3M17.4 17.4l-3-3M19.7 8.8l-3.9.9" stroke="#d8ad45" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.4" stroke="#d8ad45" strokeWidth="1.4" />
      <path d="M3.5 9.5h17M8.3 4.5v15" stroke="#d8ad45" strokeWidth="1.2" />
    </svg>
  );
}
