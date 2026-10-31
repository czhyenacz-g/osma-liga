import Image from "next/image";
import Link from "next/link";
import ClubPreviewLightbox from "@/components/ClubPreviewLightbox";

const NAV = [
  { label: "Úvod",      href: "/" },
  { label: "Hrát",      href: "/hra/bot" },
  { label: "Online",    href: "/hra/multiplayer" },
  { label: "Turnaje",   href: "/turnaj" },
  { label: "Kluby",     href: "/kluby" },
];

export default function SiteFooter() {
  return (
    <footer
      id="partneri"
      style={{ borderTop: "1px solid rgba(216,173,69,0.22)", background: "linear-gradient(to bottom, #063f24 0%, #052e1a 60%, #041f14 100%)" }}
    >
      {/* Partner / spolupráce box */}
      <div className="mx-auto max-w-[1240px] px-6 pt-8 pb-4 lg:pt-12 lg:pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div
            className="lg:basis-1/2 rounded-xl px-5 py-5 sm:px-7 sm:py-7"
            style={{
              background: "rgba(6,63,36,0.55)",
              border: "1px solid rgba(216,173,69,0.28)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.22)",
            }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.18em] mb-3"
              style={{ color: "#d8ad45" }}
            >
              Spolupráce, reklama a skutečné kluby
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(209,250,229,0.82)" }}>
              Máte hospodu u hřiště, obchod, službu nebo projekt, který patří k fotbalu
              a okresnímu životu? Na Osmé lize může být prostor pro vaši reklamu, partnerství
              nebo sponzoring zápasu, klubu či celé soutěže.
            </p>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(209,250,229,0.82)" }}>
              Skutečný tým z nižší soutěže, který se na internetu skoro nedá najít? Ozvěte se,
              můžu vám připravit jednoduchou klubovou stránku.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row mb-4">
              <a
                href="mailto:info@osmaliga.cz?subject=Partnerství s Osmou ligou"
                className="inline-flex flex-1 items-center justify-center rounded-lg px-5 py-2 text-sm font-bold transition hover:opacity-90"
                style={{ background: "#d8ad45", color: "#052e1a" }}
              >
                Chci být partner
              </a>
              <a
                href="mailto:info@osmaliga.cz?subject=Stránka pro skutečný klub"
                className="inline-flex flex-1 items-center justify-center rounded-lg px-5 py-2 text-sm font-bold transition hover:opacity-90"
                style={{ background: "rgba(216,173,69,0.12)", color: "#d8ad45", border: "1px solid rgba(216,173,69,0.4)" }}
              >
                Chci stránku pro klub
              </a>
            </div>

            <p className="text-sm" style={{ color: "rgba(209,250,229,0.82)" }}>
              Napište na{" "}
              <a
                href="mailto:info@osmaliga.cz"
                className="font-semibold transition hover:opacity-80"
                style={{ color: "#d8ad45" }}
              >
                info@osmaliga.cz
              </a>
              . <span className="italic" style={{ color: "rgba(209,250,229,0.45)" }}>Hrdinové okresu si zaslouží být vidět.</span>
            </p>
          </div>

          {/* Ukázka klubové stránky — jen na širokém displeji; na mobilu by
              zabrala celou obrazovku a odkaz "Chci stránku pro klub" stačí. */}
          <div className="hidden lg:block w-full lg:basis-1/2">
            <ClubPreviewLightbox
              src="/tupoljany_preview.webp"
              alt="Ukázka klubové stránky v Osmé lize"
              caption="Ukázka klubové stránky"
            />
          </div>
        </div>
      </div>

      {/* Hlavní obsah */}
      <div className="mx-auto max-w-[1240px] px-6 py-6 md:py-8 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6 md:gap-8">

        {/* Levý sloupec — brand */}
        <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
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
                Fotbalová hra z českého okresu
              </div>
            </div>
          </div>
          <div className="mt-1 hidden md:block">
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
              <span className="text-xs" style={{ color: "rgba(209,250,229,0.4)" }}>trenér Náhoda FC a programátor těchto stránek</span>
            </p>
            <a
              href="mailto:info@osmaliga.cz"
              className="text-sm transition hover:opacity-80 mt-1 inline-block"
              style={{ color: "#d8ad45" }}
            >
              info@osmaliga.cz
            </a>
          </div>
        </div>

      </div>

      {/* Spodní disclaimer */}
      <div
        className="mx-auto max-w-[1240px] px-6 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(209,250,229,0.35)" }}>
          Osmá liga je fotbalová hra inspirovaná českým okresem. Kluby, výsledky i Náhoda FC jsou fiktivní;
          nejde o oficiální web FAČR ani žádné skutečné soutěže.
        </p>
        <p className="mt-2 text-[11px]" style={{ color: "rgba(209,250,229,0.25)" }}>
          Ligový svět:{" "}
          {[
            { slug: "treti-liga", label: "3. liga" },
            { slug: "ctvrta-liga", label: "4. liga" },
            { slug: "pata-liga", label: "5. liga" },
            { slug: "sesta-liga", label: "6. liga" },
            { slug: "sedma-liga", label: "7. liga" },
          ].map((l, i) => (
            <span key={l.slug}>
              {i > 0 && " · "}
              <Link href={`/${l.slug}`} className="transition hover:opacity-80" style={{ color: "rgba(209,250,229,0.4)" }}>
                {l.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
