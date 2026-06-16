import Image from "next/image";

const NAV = [
  { label: "Úvod",     href: "#uvod",      active: true  },
  { label: "Výsledky", href: "#vysledky",  active: false },
  { label: "Kluby",    href: "#kluby",     active: false },
  { label: "Nábor",    href: "#aktuality", active: false },
  { label: "Partneři", href: "#partneri",  active: false },
];

export default function LeagueHeader() {
  return (
    <header
      className="text-white shadow-xl"
      style={{
        background: "linear-gradient(135deg, #052e1a 0%, #0a3d22 60%, #0f4a2a 100%)",
        borderBottom: "2px solid #2d7a45",
      }}
    >
      <div
        className="mx-auto flex max-w-[1240px] items-center gap-6 px-6"
        style={{ minHeight: "120px" }}
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
        <div className="shrink-0">
          <div
            className="font-extrabold leading-none text-white"
            style={{ fontSize: "clamp(26px, 3vw, 40px)", letterSpacing: "-0.01em" }}
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

        {/* Slogan */}
        <div
          className="hidden lg:block shrink-0 text-right italic font-semibold leading-snug"
          style={{ color: "#d6a94a", fontSize: "clamp(18px, 1.6vw, 26px)" }}
        >
          VAR nemáme,
          <br />
          hraj dál.
        </div>

        {/* Navigace — mobil (první 3 položky) */}
        <nav className="md:hidden flex items-center gap-0.5 ml-auto flex-wrap justify-end">
          {NAV.slice(0, 3).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider hover:text-[#f0c75e] transition ${
                item.active ? "text-white" : "text-white/60"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
