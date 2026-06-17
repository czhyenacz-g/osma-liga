import Image from "next/image";

const NAV = [
  { label: "Šatna",    href: "/satna",     active: false },
  { label: "Výsledky", href: "#vysledky",  active: false },
  { label: "Kluby",    href: "#kluby",     active: false },
  { label: "Nábor",    href: "#aktuality", active: false },
  { label: "Partneři", href: "#partneri",  active: false },
];

export default function LeagueHeader() {
  return (
    <header
      className="relative text-white shadow-xl"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Tmavý overlay přes sdílené stadionové pozadí */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(3,22,10,0.88) 0%, rgba(5,46,26,0.82) 100%)" }}
      />

      <div
        className="relative mx-auto flex flex-wrap max-w-[1240px] items-center gap-x-4 sm:gap-x-6 px-4 sm:px-6 py-3 sm:py-0"
        style={{ minHeight: "100px" }}
      >
        {/* Logo */}
        <div className="shrink-0">
          <Image
            src="/nahoda_banner.webp"
            alt="Náhoda FC"
            width={96}
            height={96}
            className="object-contain drop-shadow-lg"
            style={{ width: 96, height: 96 }}
          />
        </div>

        {/* Brand text */}
        <div className="shrink-0 min-w-0">
          <div
            className="font-extrabold leading-none text-white"
            style={{ fontSize: "clamp(22px, 3vw, 40px)", letterSpacing: "-0.01em" }}
          >
            Osmá liga
          </div>
          <div
            className="mt-1 font-semibold uppercase tracking-[0.22em]"
            style={{ fontSize: "10px", color: "#6dbf8a" }}
          >
            Oficiální web soutěže
          </div>
        </div>

        {/* Oddělovač */}
        <div className="hidden lg:block h-14 w-px bg-white/10 ml-2 shrink-0" />

        {/* Navigace — desktop */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`
                relative px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition
                hover:text-[#f0c75e]
                ${item.active ? "text-white" : "text-white/60"}
              `}
            >
              {item.label}
              {item.active && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: "#d6a94a" }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* Oddělovač před sloganem */}
        <div className="hidden lg:block h-14 w-px bg-white/10 shrink-0" />

        {/* SVG slogan */}
        <div className="hidden lg:flex shrink-0 items-center">
          <Image
            src="/var-slogan.svg"
            alt="VAR nemáme, hraj dál."
            width={200}
            height={92}
            className="object-contain"
            style={{ width: 200, height: "auto" }}
          />
        </div>

        {/* Navigace — mobil (řádek pod brandem) */}
        <nav className="md:hidden w-full flex items-center gap-4 justify-center pb-2">
          {([
            { label: "Šatna",    href: "/satna"    },
            { label: "Kluby",    href: "#kluby"    },
            { label: "Partneři", href: "#partneri" },
          ] as const).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-1 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-[#f0c75e] transition"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
