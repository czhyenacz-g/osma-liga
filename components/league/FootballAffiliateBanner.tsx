import Image from "next/image";
import { buildDognetUrl } from "@/lib/dognet";

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
