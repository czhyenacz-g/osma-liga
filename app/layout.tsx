import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { GOATCOUNTER_CODE } from "./config/analytics";

export const metadata: Metadata = {
  title: "Osmá liga — oficiální web soutěže",
  description:
    "Fiktivní web Osmé ligy a připravované arkádové fotbalové hry. Sleduj Náhoda FC a další kluby nižší soutěže.",
  openGraph: {
    title: "Osmá liga — oficiální web soutěže",
    description:
      "Fiktivní web Osmé ligy a připravované arkádové fotbalové hry. Sleduj Náhoda FC a další kluby nižší soutěže.",
    url: "https://osmaliga.cz",
    siteName: "Osmá liga",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osmá liga — oficiální web soutěže",
    description:
      "Fiktivní web Osmé ligy a připravované arkádové fotbalové hry. Sleduj Náhoda FC a další kluby nižší soutěže.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="bg-white text-gray-900 antialiased">
        {children}
        <Analytics />
        {GOATCOUNTER_CODE && (
          <Script
            data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`}
            src="//gc.zgo.at/count.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
