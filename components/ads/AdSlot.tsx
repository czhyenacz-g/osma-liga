import type { CSSProperties } from "react";
import { getImageProps } from "next/image";
import {
  AD_CAMPAIGNS,
  campaignHref,
  campaignRel,
  getActiveCampaign,
  type AdCampaign,
  type AdSlotId,
} from "@/lib/ads/campaigns";

// Reklamní slot z Git konfigurace (lib/ads/campaigns.ts). Bez aktivní
// kampaně vrací null — nevykreslí se ani obal, žádný prázdný rámeček.
// Štítek je text mimo obrázek; desktop/mobil přes <picture> (zlom 640 px),
// width/height u obou zdrojů drží poměr stran, takže načtení nic neposune.
export default function AdSlot({
  slot,
  d2,
  theme = "dark",
  className,
  style,
  innerClassName = "",
  now = new Date(),
  campaigns = AD_CAMPAIGNS,
}: {
  slot: AdSlotId;
  /** Přepíše Dognet d2 kampaně (ligové stránky: "treti" … "osma"). */
  d2?: string;
  theme?: "dark" | "light";
  className?: string;
  style?: CSSProperties;
  innerClassName?: string;
  now?: Date;
  campaigns?: readonly AdCampaign[];
}) {
  const campaign = getActiveCampaign(slot, now, campaigns);
  if (!campaign) return null;

  const sizes = "(min-width: 1024px) 1024px, 100vw";
  const { props: desktop } = getImageProps({ ...campaign.image, sizes });
  const mobile = campaign.imageMobile && getImageProps({ ...campaign.imageMobile, sizes: "100vw" }).props;
  const dark = theme === "dark";

  return (
    <aside aria-label={campaign.label} data-ad-slot={slot} className={className} style={style}>
      <div className={innerClassName}>
        <p
          className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wide ${dark ? "" : "text-gray-400"}`}
          style={dark ? { color: "rgba(209,250,229,0.5)" } : undefined}
        >
          {campaign.label}
        </p>
        <a
          href={campaignHref(campaign, d2)}
          target="_blank"
          rel={campaignRel(campaign)}
          className={`block overflow-hidden transition hover:opacity-90 ${dark ? "" : "rounded-xl border border-gray-200"}`}
        >
          <picture>
            {mobile && (
              <source
                media="(max-width: 639px)"
                srcSet={mobile.srcSet}
                sizes={mobile.sizes}
                width={mobile.width}
                height={mobile.height}
              />
            )}
            <img {...desktop} alt={campaign.image.alt} className="block h-auto w-full" />
          </picture>
        </a>
      </div>
    </aside>
  );
}
