import Image from "next/image";

const DOGNET_CHID = "HgqwsHBn";
const DOGNET_D1 = "osmaliga";
const DOGNET_TARGET_URL = "https://www.fotbalovydarek.cz/";

function buildDognetUrl(d2: string): string {
  const params = new URLSearchParams({
    chid: DOGNET_CHID,
    d1: DOGNET_D1,
    d2,
    url: DOGNET_TARGET_URL,
  });
  return `https://go.dognet.com/?${params.toString()}`;
}

export default function FootballAffiliateBanner({ d2 = "main" }: { d2?: string }) {
  return (
    <section className="mb-10">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Partnerská nabídka
      </p>
      <a
        href={buildDognetUrl(d2)}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="block overflow-hidden rounded-xl border border-gray-200 transition hover:opacity-95"
      >
        <Image
          src="/banner_pro_fanousky.webp"
          alt="FotbalovyDarek.cz — dárky a suvenýry pro fotbalové fanoušky"
          width={2127}
          height={739}
          className="h-auto w-full"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      </a>
    </section>
  );
}
