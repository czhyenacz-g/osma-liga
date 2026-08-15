import Image from "next/image";
import { buildDognetUrl } from "@/lib/dognet";

export default function HomeAffiliateBanner() {
  return (
    <a
      href={buildDognetUrl("homepage-banner")}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="mt-10 block w-full max-w-5xl transition hover:opacity-90"
    >
      <Image
        src="/banner_main.webp"
        alt="FotbalovyDarek.cz — partnerská nabídka pro fotbalové fanoušky"
        width={2121}
        height={210}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 1024px, 100vw"
      />
    </a>
  );
}
