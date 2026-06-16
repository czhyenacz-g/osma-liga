import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { GOATCOUNTER_CODE } from "./config/analytics";

export const metadata: Metadata = {
  title: "Osmá liga — VAR nemáme, hraj dál",
  description:
    "Česká arkádová fotbalová hra z prostředí okresního fotbalu. Veď Náhoda FC z nízké ligy až nahoru.",
  openGraph: {
    title: "Osmá liga — VAR nemáme, hraj dál",
    description:
      "Česká arkádová fotbalová hra z prostředí okresního fotbalu. Veď Náhoda FC z nízké ligy až nahoru.",
    url: "https://osmaliga.cz",
    siteName: "Osmá liga",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Osmá liga — VAR nemáme, hraj dál",
    description:
      "Česká arkádová fotbalová hra z prostředí okresního fotbalu. Veď Náhoda FC z nízké ligy až nahoru.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="bg-slate-900 text-white antialiased">
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
