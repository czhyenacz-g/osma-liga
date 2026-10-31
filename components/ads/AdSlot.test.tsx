import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AdSlot from './AdSlot';
import { AD_CAMPAIGNS } from '@/lib/ads/campaigns';

const NOW = new Date('2026-11-01T12:00:00Z');

afterEach(() => { cleanup(); });

describe('AdSlot', () => {
  it('renders nothing at all — no wrapper — without a live campaign', () => {
    const off = AD_CAMPAIGNS.map((c) => ({ ...c, active: false }));
    const { container } = render(<AdSlot slot="homepage_primary" className="px-4" now={NOW} campaigns={off} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the label as text outside the image, the Dognet link and the mobile source', () => {
    const { container, getByText } = render(<AdSlot slot="homepage_primary" now={NOW} />);
    const label = getByText('Partnerská nabídka');
    expect(label.closest('a')).toBeNull();
    const a = container.querySelector('a')!;
    expect(a.getAttribute('href')).toContain('d2=homepage-banner');
    expect(a.getAttribute('rel')).toBe('sponsored noopener noreferrer');
    expect(a.getAttribute('target')).toBe('_blank');
    const source = container.querySelector('picture source')!;
    expect(source.getAttribute('media')).toBe('(max-width: 639px)');
    expect(source.getAttribute('srcset')).toContain('banner_pro_fanousky.webp');
    expect(source.getAttribute('width')).toBe('2127');
    expect(source.getAttribute('height')).toBe('739');
    const img = container.querySelector('picture img')!;
    expect(img.getAttribute('src')).toContain('banner_main.webp');
    expect(img.getAttribute('width')).toBe('2121');
    expect(img.getAttribute('height')).toBe('210');
  });

  it('league slot passes the page d2 through and has no mobile source', () => {
    const { container } = render(<AdSlot slot="league_page" d2="treti" theme="light" now={NOW} />);
    expect(container.querySelector('a')!.getAttribute('href')).toContain('d2=treti');
    expect(container.querySelector('picture source')).toBeNull();
  });

  it('a gambling campaign is not rendered even when active', () => {
    const gambling = AD_CAMPAIGNS.map((c) => ({ ...c, category: 'gambling' as const }));
    const { container } = render(<AdSlot slot="homepage_primary" now={NOW} campaigns={gambling} />);
    expect(container.innerHTML).toBe('');
  });
});
