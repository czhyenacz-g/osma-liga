import type { Metadata } from "next";
import Link from "next/link";
import LeagueHeader from "@/components/league/LeagueHeader";
import SiteFooter from "@/components/league/SiteFooter";

export const metadata: Metadata = {
  title: "Obecní přebor — Osmá liga",
  description: "Hraní Osmé ligy je zatím dostupné jen v EU.",
  robots: { index: false },
};

export default function ObecniPreborPage() {
  return (
    <>
      <div
        style={{
          backgroundImage: "url(/top_background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "top center",
        }}
      >
        <LeagueHeader compact />
      </div>

      <main className="bg-white min-h-screen flex items-center justify-center">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <div className="text-5xl mb-6">🏟️</div>
          <h1 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
            Osmá liga je zatím obecní přebor pro Evropu
          </h1>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            Mimo EU zatím nehrajeme — výbor nemá cestovní náhrady.
          </p>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            Veřejné stránky klubů si ale můžeš prohlédnout dál.
          </p>
          <Link
            href="/kluby"
            className="inline-block rounded-lg px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "#063f24" }}
          >
            Zpět na kluby
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
