import type { Metadata } from "next";
import ComingSoonHome from "@/components/league/ComingSoonHome";
import { absoluteUrl, ogImageUrl, siteName } from "@/lib/seo";

const TITLE = "Osmá liga – nová sezóna začíná 1. září";
const DESCRIPTION =
  "Osmá liga se připravuje. Vyber si klub a od 1. září hraj online okresní fotbal proti počítači nebo ostatním hráčům.";

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
  return <ComingSoonHome />;
}
