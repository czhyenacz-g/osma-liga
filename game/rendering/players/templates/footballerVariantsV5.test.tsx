import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import { getFootballerVariantV5, lightenHex, FIELD_ARCHETYPES_V5 } from './footballerVariantsV5';
import SvgFootballerPlayerV5 from './SvgFootballerPlayerV5';
import PlayerVisualContainer, { type PlayerVisualContainerHandle, v5LabelY } from '../PlayerVisualContainer';
import PlayerRenderer, { type PlayerRendererHandle } from '../PlayerRenderer';
import { TEAM_COLORS } from '../playerVisualConfig';
import type { PlayerRenderState, PlayerTeam } from '../playerVisualTypes';

function draw(label: string, team: PlayerTeam = 'home', isGoalkeeper = false) {
  const { primary, secondary } = TEAM_COLORS[team];
  return render(
    <svg>
      <SvgFootballerPlayerV5 team={team} label={label} primaryColor={primary} secondaryColor={secondary} hitboxRadiusPx={18} isGoalkeeper={isGoalkeeper} sizeScale={1} />
    </svg>,
  ).container;
}

const fills = (root: Element) => new Set([...root.querySelectorAll('[fill]')].map((e) => e.getAttribute('fill')));

describe('svg-footballers-v5 archetypes', () => {
  it('has five archetypes: four field players + the goalkeeper', () => {
    expect(FIELD_ARCHETYPES_V5).toEqual(['classic', 'messy', 'curly', 'crop']);
    expect(getFootballerVariantV5('GK', true).archetype).toBe('goalkeeper');
    const seen = new Set(['N1', 'N2', 'N3', 'P1', 'P2', 'P3'].map((l) => getFootballerVariantV5(l, false).archetype));
    expect(seen.size).toBe(4);
  });

  it('gives each team\'s three players three different archetypes', () => {
    for (const t of ['N', 'P']) {
      expect(new Set([1, 2, 3].map((n) => getFootballerVariantV5(`${t}${n}`, false).archetype)).size).toBe(3);
    }
  });

  it('is deterministic — the archetype never changes for the same player', () => {
    for (const l of ['N1', 'P2', 'GK', 'X7']) {
      const first = getFootballerVariantV5(l, l === 'GK');
      for (let i = 0; i < 20; i++) expect(getFootballerVariantV5(l, l === 'GK')).toEqual(first);
    }
  });

  it('draws the archetype into the SVG and keeps it across re-renders', () => {
    const c = draw('N2');
    const a = c.querySelector('[data-archetype]')!.getAttribute('data-archetype');
    expect(a).toBe(getFootballerVariantV5('N2', false).archetype);
    expect(draw('N2').querySelector('[data-archetype]')!.getAttribute('data-archetype')).toBe(a);
  });
});

describe('svg-footballers-v5 colours', () => {
  it('kit colours come from the team, not the archetype', () => {
    const home = fills(draw('N1', 'home'));
    const away = fills(draw('N1', 'away'));
    expect(home.has(TEAM_COLORS.home.primary)).toBe(true);
    expect(home.has(TEAM_COLORS.home.secondary)).toBe(true);
    expect(home.has(TEAM_COLORS.away.primary)).toBe(false);
    expect(away.has(TEAM_COLORS.away.primary)).toBe(true);
    expect(away.has(TEAM_COLORS.home.primary)).toBe(false);
  });

  it('the goalkeeper wears a lighter team shade, dark shorts and white gloves', () => {
    const gk = fills(draw('GK', 'home', true));
    expect(gk.has(lightenHex(TEAM_COLORS.home.primary, 0.45))).toBe(true);
    expect(gk.has(TEAM_COLORS.home.primary)).toBe(false);
    expect(gk.has('#f8fafc')).toBe(true);
    expect(draw('GK', 'home', true).querySelector('[data-archetype]')!.getAttribute('data-archetype')).toBe('goalkeeper');
  });

  it('the goalkeeper has big gloves and a chest band; field players have neither', () => {
    const gk = draw('GK', 'home', true);
    const gloves = [...gk.querySelectorAll('circle[fill="#f8fafc"]')];
    expect(gloves.length).toBeGreaterThan(0);
    for (const g of gloves) expect(Number(g.getAttribute('r'))).toBeGreaterThanOrEqual(2.8);
    expect(gk.querySelector(`rect[fill="${TEAM_COLORS.home.secondary}"][height="2"]`)).not.toBeNull();
    const field = draw('N1');
    expect(field.querySelector('[fill="#f8fafc"]')).toBeNull();
    expect(field.querySelector(`rect[fill="${TEAM_COLORS.home.secondary}"][height="2"]`)).toBeNull();
  });

  it('lightenHex mixes toward white', () => {
    expect(lightenHex('#000000', 0.5)).toBe('#808080');
    expect(lightenHex('#22c55e', 0)).toBe('#22c55e');
    expect(lightenHex('#22c55e', 1)).toBe('#ffffff');
  });
});

describe('svg-footballers-v5 in the shared container', () => {
  const state = (o: Partial<PlayerRenderState>): PlayerRenderState => ({
    id: 'n1', team: 'home', label: 'N1', x: 100, y: 100, vx: 0, vy: 0, primaryColor: '#22c55e', secondaryColor: '#15803d',
    isActive: true, isMine: true, isMoving: false, facingDirection: 1, orientation: 'side', isCharging: false, chargeProgress: 0,
    isKicking: false, hasBall: false, isRemoved: false, isGoalkeeper: false, sizeScale: 1, ...o,
  });

  it('mirrors only the body; the label above the head stays readable when facing left', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer ref={ref} template="svg-footballers-v5" team="home" label="N1" primaryColor="#22c55e" secondaryColor="#15803d" hitboxRadiusPx={18} />
      </svg>,
    );
    ref.current!.update(state({ facingDirection: -1, isMoving: true, isKicking: true }));
    const label = container.querySelector('.player-visual-label')!;
    expect(label.textContent).toBe('N1');
    expect(label.closest('[transform^="scale(-1"]')).toBeNull();
    expect(container.querySelector('[transform="scale(-1 1)"] [data-archetype]')).not.toBeNull();
    const anim = container.querySelector('.player-visual-anim')!.getAttribute('class')!;
    expect(anim).toContain('footballer-player');
    expect(anim).toContain('orientation-side');
    expect(anim).toContain('is-moving');
    expect(anim).toContain('is-kicking');
  });

  it('the active oval sits at the boots, stronger than the other templates', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer ref={ref} template="svg-footballers-v5" team="home" label="N1" primaryColor="#22c55e" secondaryColor="#15803d" hitboxRadiusPx={18} />
      </svg>,
    );
    ref.current!.update(state({}));
    const ring = container.querySelector('svg > g > g > ellipse')!;
    expect(Number(ring.getAttribute('cy'))).toBeGreaterThan(10);
    expect(Number(ring.getAttribute('stroke-width'))).toBeGreaterThan(2);
    expect(ring.parentElement!.getAttribute('opacity')).toBe('1');
  });

  it('the label keeps one gap above the head and rises with the body while charging', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer ref={ref} template="svg-footballers-v5" team="home" label="N1" primaryColor="#22c55e" secondaryColor="#15803d" hitboxRadiusPx={18} />
      </svg>,
    );
    const label = container.querySelector('.player-visual-label')!;
    ref.current!.update(state({}));
    const idleY = Number(label.getAttribute('y'));
    expect(idleY).toBeCloseTo(v5LabelY(1.42));
    ref.current!.update(state({ isCharging: true, chargeProgress: 1 }));
    expect(Number(label.getAttribute('y'))).toBeCloseTo(v5LabelY(1.42 * 1.2));
    expect(Number(label.getAttribute('y'))).toBeLessThan(idleY);
    // Tallest hair (local y = -31) never reaches the label baseline.
    expect(v5LabelY(1.42 * 1.2)).toBeLessThan(-31 * 1.42 * 1.2);
  });
});

describe('svg-footballers-v5 ball readability', () => {
  const player = (o: Partial<PlayerRenderState> = {}): PlayerRenderState => ({
    id: 'n1', team: 'home', label: 'N1', x: 100, y: 100, vx: 0, vy: 0, primaryColor: '#22c55e', secondaryColor: '#15803d',
    isActive: true, isMine: true, isMoving: false, facingDirection: 1, orientation: 'back', isCharging: false, chargeProgress: 0,
    isKicking: false, hasBall: true, isRemoved: false, isGoalkeeper: false, sizeScale: 1, ...o,
  });
  const mount = (template: 'svg-footballers-v5' | 'svg-footballers-v4') => {
    const ref = createRef<PlayerRendererHandle>();
    const { container } = render(
      <PlayerRenderer ref={ref} template={template} viewBoxWidth={960} viewBoxHeight={540} hitboxRadiusPx={18} initialPlayers={[player()]} />,
    );
    return { ref, container };
  };

  it('draws the ball above a player only while it overlaps the body', () => {
    const { ref, container } = mount('svg-footballers-v5');
    const ball = container.querySelector('.player-visual-ball-overlay')!;
    ref.current!.update([player()], { x: 100, y: 75, rotation: 0 }); // dribbling upward: ball over the torso
    expect(ball.getAttribute('opacity')).toBe('1');
    expect(ball.getAttribute('transform')).toBe('translate(100 75) rotate(0)');
    ref.current!.update([player()], { x: 200, y: 100, rotation: 0 }); // free on the grass
    expect(ball.getAttribute('opacity')).toBe('0');
  });

  it('is v5-only — the other styles are unchanged', () => {
    const { container } = mount('svg-footballers-v4');
    expect(container.querySelector('.player-visual-ball-overlay')).toBeNull();
  });
});
