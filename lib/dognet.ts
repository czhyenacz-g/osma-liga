// Shared helper for building FotbalovyDarek.cz affiliate links via Dognet.
// chid/d1/target URL stay fixed; only d2 varies per placement so we can
// track which spot on the site drove the click.

const DOGNET_CHID = "HgqwsHBn";
const DOGNET_D1 = "osmaliga";
const DOGNET_TARGET_URL = "https://www.fotbalovydarek.cz/";

export function buildDognetUrl(d2: string): string {
  const params = new URLSearchParams({
    chid: DOGNET_CHID,
    d1: DOGNET_D1,
    d2,
    url: DOGNET_TARGET_URL,
  });
  return `https://go.dognet.com/?${params.toString()}`;
}
