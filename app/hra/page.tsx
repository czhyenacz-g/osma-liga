import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zápas se připravuje — Osmá liga",
};

export default function HraPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-sm space-y-4">
        <div className="text-5xl">⚽</div>
        <h1 className="text-2xl font-black text-gray-900">Zápas se připravuje</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Hráči hledají míč, rozhodčí píšťalku a trenér Dařbujan základní sestavu.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          ← Zpět na web Osmé ligy
        </Link>
      </div>
    </main>
  );
}
