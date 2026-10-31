import Image from "next/image";
import { buildDognetUrl } from "@/lib/dognet";

// Rozměry zdrojového banner_main.webp — drží rezervované místo (žádný CLS)
// i ve chvíli, kdy se obrázek ještě nenačetl nebo selže.
const WIDTH = 2121;
const HEIGHT = 210;

export default function HomeAffiliateBanner({
  className = "mt-10 block w-full max-w-5xl",
}: {
  className?: string;
}) {
  return (
    <a
      href={buildDognetUrl("homepage-banner")}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`${className} overflow-hidden transition hover:opacity-90`}
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, color: "rgba(209,250,229,0.6)" }}
    >
      <Image
        src="/banner_main.webp"
        alt="FotbalovyDarek.cz — partnerská nabídka pro fotbalové fanoušky"
        width={WIDTH}
        height={HEIGHT}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 1024px, 100vw"
      />
    </a>
  );
}
