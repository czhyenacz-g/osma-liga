import Image from "next/image";

const NAV = [
  { label: "Úvod",      href: "#uvod" },
  { label: "Výsledky",  href: "#vysledky" },
  { label: "Kluby",     href: "#kluby" },
  { label: "Nábor",     href: "#aktuality" },
  { label: "Partneři",  href: "#partneri" },
];

export default function SiteFooter() {
  return (
    <footer
      id="partneri"
      style={{ borderTop: "1px solid rgba(216,173,69,0.22)", background: "linear-gradient(to bottom, #063f24 0%, #052e1a 60%, #041f14 100%)" }}
    >
      {/* Hlavní obsah */}
      <div className="mx-auto max-w-[1240px] px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

        {/* Levý sloupec — brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/nahoda_banner.webp"
              alt="Náhoda FC"
              width={80}
              height={80}
              className="object-contain drop-shadow-lg shrink-0"
              style={{ width: 80, height: 80 }}
            />
            <div>
              <div className="font-extrabold text-white leading-tight" style={{ fontSize: "1.25rem", letterSpacing: "-0.01em" }}>
                Osmá liga
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5" style={{ color: "#6dbf8a" }}>
                Oficiální web soutěže
              </div>
            </div>
          </div>
          <div className="mt-1">
            <Image
              src="/var-slogan.svg"
              alt="VAR nemáme, hraj dál."
              width={155}
              height={72}
              className="object-contain"
              style={{ width: 155, height: "auto" }}
            />
          </div>
        </div>

        {/* Prostřední sloupec — navigace */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white mb-1">
            Osmá liga
          </p>
          <ul className="space-y-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm transition hover:text-[#d8ad45]"
                  style={{ color: "rgba(209,250,229,0.6)" }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Pravý sloupec — kontakt */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white mb-1">
            Kontakt / klub
          </p>
          <div className="space-y-1.5">
            <p className="text-sm font-bold" style={{ color: "#d8ad45" }}>Náhoda FC</p>
            <p className="text-sm" style={{ color: "rgba(209,250,229,0.6)" }}>Hřiště za hasičárnou</p>
            <p className="text-sm" style={{ color: "rgba(209,250,229,0.6)" }}>
              Hynek Dařbujan
              <br />
              <span className="text-xs" style={{ color: "rgba(209,250,229,0.4)" }}>trenér Náhoda FC</span>
            </p>
          </div>
        </div>

      </div>

      {/* Spodní disclaimer */}
      <div
        className="mx-auto max-w-[1240px] px-6 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(209,250,229,0.35)" }}>
          Osmá liga je připravovaná arkádová fotbalová hra a parodie klubového webu. Náhoda FC je fiktivní klub.
        </p>
      </div>
    </footer>
  );
}
