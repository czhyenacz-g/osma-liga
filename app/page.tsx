import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AuthStatus from "@/components/auth/AuthStatus";
import { absoluteUrl, ogImageUrl, siteName } from "@/lib/seo";

const TITLE = "Osmá liga se připravuje";
const DESCRIPTION =
  "Osmá liga se připravuje na novou sezónu. Nová sezóna začíná 1. září 2026 — vyber si klub, vlez na hřiště.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/"),
    images: [{ url: ogImageUrl(siteName, "Nová sezóna začíná 1. září 2026") }],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <div
      className="relative flex min-h-screen flex-col text-white"
      style={{
        backgroundImage: "url(/top_background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      {/* Jemný ztmavující overlay pro čitelnost textu nad stadionovým pozadím */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(3,22,10,0.55) 0%, rgba(5,46,26,0.4) 45%, rgba(3,22,10,0.65) 100%)" }}
      />

      <header className="relative shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 py-3"
          style={{ minHeight: "88px" }}
        >
          <Link href="/" className="flex items-center gap-4 shrink-0 hover:opacity-90 transition">
            <Image
              src="/nahoda_banner.webp"
              alt="Náhoda FC"
              width={72}
              height={72}
              className="object-contain drop-shadow-lg"
              style={{ width: 72, height: 72 }}
            />
            <div className="min-w-0">
              <div
                className="font-extrabold leading-none text-white"
                style={{ fontSize: "clamp(20px, 3vw, 32px)", letterSpacing: "-0.01em" }}
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
          </Link>

          <AuthStatus />
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1
          className="font-extrabold uppercase"
          style={{
            fontSize: "clamp(32px, 7vw, 72px)",
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            textShadow: "0 2px 24px rgba(0,0,0,0.65), 0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          Osmá liga se připravuje
        </h1>
        <p
          className="mt-6 font-semibold uppercase tracking-[0.15em]"
          style={{
            fontSize: "clamp(15px, 2.2vw, 22px)",
            color: "#d6a94a",
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          Nová sezóna začíná 1. září 2026
        </p>
        <p
          className="mt-4 text-white/90"
          style={{ fontSize: "clamp(14px, 1.6vw, 18px)", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
        >
          Vyber si klub. Vlez na hřiště.
        </p>
      </main>
    </div>
  );
}
