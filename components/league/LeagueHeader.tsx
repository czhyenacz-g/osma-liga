import Image from "next/image";

const NAV = [
  { label: "Úvod",     href: "#uvod" },
  { label: "Výsledky", href: "#vysledky" },
  { label: "Kluby",    href: "#kluby" },
  { label: "Nábor",    href: "#aktuality" },
  { label: "Partneři", href: "#partneri" },
];

export default function LeagueHeader() {
  return (
    <header className="bg-green-900 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo + název */}
        <div className="flex items-center gap-3 shrink-0">
          <Image
            src="/nahoda_banner.webp"
            alt="Náhoda FC"
            width={44}
            height={44}
            className="rounded-full object-contain"
          />
          <div>
            <div className="text-base font-black leading-tight tracking-tight">Osmá liga</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-green-300/80">
              Oficiální web soutěže
            </div>
          </div>
        </div>

        {/* Navigace */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 text-sm font-medium text-green-100/80 transition hover:bg-green-800 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
