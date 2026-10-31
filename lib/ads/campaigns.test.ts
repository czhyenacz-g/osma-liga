import { describe, it, expect } from 'vitest';
import {
  AD_CAMPAIGNS,
  campaignHref,
  campaignRel,
  getActiveCampaign,
  type AdCampaign,
} from './campaigns';

const NOW = new Date('2026-11-01T12:00:00Z');

function campaign(over: Partial<AdCampaign> = {}): AdCampaign {
  return {
    id: 'test',
    slot: 'homepage_primary',
    title: 'Test',
    category: 'partner',
    label: 'Reklama',
    image: { src: '/a.webp', width: 100, height: 10, alt: 'A' },
    link: { type: 'url', href: 'https://example.com/' },
    active: true,
    ...over,
  };
}

describe('getActiveCampaign', () => {
  it('returns the active campaign of the slot', () => {
    const c = campaign();
    expect(getActiveCampaign('homepage_primary', NOW, [c])).toBe(c);
    expect(getActiveCampaign('league_page', NOW, [c])).toBeNull();
  });

  it('skips an inactive campaign', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ active: false })])).toBeNull();
  });

  it('skips a campaign before validFrom and after validUntil', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validFrom: '2026-11-01T12:00:01Z' })])).toBeNull();
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validUntil: '2026-11-01T11:59:59Z' })])).toBeNull();
  });

  it('validFrom is inclusive, validUntil exclusive, offsets are respected', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validFrom: '2026-11-01T12:00:00Z' })])).not.toBeNull();
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validUntil: '2026-11-01T12:00:00Z' })])).toBeNull();
    // 13:00 in Prague (+01:00) is exactly NOW.
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validFrom: '2026-11-01T13:00:00+01:00' })])).not.toBeNull();
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validUntil: '2026-11-01T13:00:00+01:00' })])).toBeNull();
  });

  it('rejects ambiguous or invalid dates instead of guessing', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validFrom: '2026-10-01' })])).toBeNull();
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validUntil: '2027-01-01T00:00:00' })])).toBeNull();
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ validFrom: 'zítra' })])).toBeNull();
  });

  it('returns null when there is no campaign', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [])).toBeNull();
  });

  it('never returns a gambling campaign, even when active', () => {
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ category: 'gambling' })])).toBeNull();
    const next = campaign({ id: 'next' });
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ category: 'gambling' }), next])).toBe(next);
  });

  it('picks the first live campaign in array order when several match', () => {
    const a = campaign({ id: 'a' }), b = campaign({ id: 'b' });
    expect(getActiveCampaign('homepage_primary', NOW, [a, b])).toBe(a);
    expect(getActiveCampaign('homepage_primary', NOW, [campaign({ id: 'off', active: false }), b])).toBe(b);
  });
});

describe('configured campaigns', () => {
  it('homepage keeps the original Dognet link (chid, d1, d2=homepage-banner, target)', () => {
    const c = getActiveCampaign('homepage_primary', NOW)!;
    expect(campaignHref(c)).toBe(
      'https://go.dognet.com/?chid=HgqwsHBn&d1=osmaliga&d2=homepage-banner&url=https%3A%2F%2Fwww.fotbalovydarek.cz%2F',
    );
    expect(campaignRel(c)).toBe('sponsored noopener noreferrer');
  });

  it('league pages keep their own d2 per league', () => {
    const c = getActiveCampaign('league_page', NOW)!;
    expect(campaignHref(c, 'sedma')).toContain('d2=sedma');
    expect(campaignHref(c, 'sedma')).toContain('chid=HgqwsHBn');
    expect(campaignHref(c)).toContain('d2=main');
  });

  it('homepage uses the 2.9:1 fan banner on mobile', () => {
    const c = getActiveCampaign('homepage_primary', NOW)!;
    expect(c.image).toMatchObject({ src: '/banner_main.webp', width: 2121, height: 210 });
    expect(c.imageMobile).toMatchObject({ src: '/banner_pro_fanousky.webp', width: 2127, height: 739 });
  });

  it('internal promotion is not marked sponsored', () => {
    expect(campaignRel(campaign({ category: 'internal' }))).toBe('noopener noreferrer');
  });

  it('every configured campaign has a label and an alt text', () => {
    for (const c of AD_CAMPAIGNS) {
      expect(c.label.trim()).not.toBe('');
      expect(c.image.alt.trim()).not.toBe('');
    }
  });
});
