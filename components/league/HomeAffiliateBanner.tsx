import AdSlot from "@/components/ads/AdSlot";

// Partnerský banner homepage (slot homepage_primary, lib/ads/campaigns.ts).
// Bez aktivní kampaně nevykreslí nic — ani tmavý pruh kolem.
export default function HomeAffiliateBanner() {
  return (
    <AdSlot
      slot="homepage_primary"
      className="px-4 sm:px-6 pt-8"
      style={{ background: "#0a1f10" }}
      innerClassName="mx-auto w-full max-w-5xl"
    />
  );
}
