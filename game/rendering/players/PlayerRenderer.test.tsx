import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import PlayerRenderer, { type PlayerRendererHandle } from './PlayerRenderer';
import type { PlayerRenderState } from './playerVisualTypes';

function makeState(overrides: Partial<PlayerRenderState> = {}): PlayerRenderState {
  return {
    id: 'n1',
    team: 'home',
    label: 'N1',
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    primaryColor: '#22c55e',
    secondaryColor: '#15803d',
    isActive: false,
    isMine: true,
    isMoving: false,
    facingDirection: 1,
    isCharging: false,
    chargeProgress: 0,
    isKicking: false,
    hasBall: false,
    isRemoved: false,
    ...overrides,
  };
}

describe('PlayerRenderer', () => {
  it('renders the shared SVG overlay for any template without crashing', () => {
    for (const template of ['pixel-characters', 'minimal-circles', 'legacy'] as const) {
      const { container, unmount } = render(
        <PlayerRenderer
          template={template}
          viewBoxWidth={960}
          viewBoxHeight={540}
          hitboxRadiusPx={18}
          initialPlayers={[makeState()]}
        />,
      );
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  it('exposes an imperative update() that moves a player without any React state churn for position', () => {
    const ref = createRef<PlayerRendererHandle>();
    const { container } = render(
      <PlayerRenderer
        ref={ref}
        template="pixel-characters"
        viewBoxWidth={960}
        viewBoxHeight={540}
        hitboxRadiusPx={18}
        initialPlayers={[makeState({ x: 10, y: 10 })]}
      />,
    );

    ref.current!.update([makeState({ x: 500, y: 300 })]);

    const outerGroup = container.querySelector('svg > g');
    expect(outerGroup?.getAttribute('transform')).toBe('translate(500 300)');
  });

  it('toggles the is-moving class on the animation wrapper based on isMoving', () => {
    const ref = createRef<PlayerRendererHandle>();
    const { container } = render(
      <PlayerRenderer
        ref={ref}
        template="pixel-characters"
        viewBoxWidth={960}
        viewBoxHeight={540}
        hitboxRadiusPx={18}
        initialPlayers={[makeState()]}
      />,
    );

    ref.current!.update([makeState({ isMoving: true })]);
    const animGroupMoving = container.querySelector('.player-visual-anim.pixel-player');
    expect(animGroupMoving?.classList.contains('is-moving')).toBe(true);

    ref.current!.update([makeState({ isMoving: false })]);
    const animGroupStill = container.querySelector('.player-visual-anim.pixel-player');
    expect(animGroupStill?.classList.contains('is-moving')).toBe(false);
  });

  it('does not recreate players when only position changes (same id set)', () => {
    const ref = createRef<PlayerRendererHandle>();
    const { container } = render(
      <PlayerRenderer
        ref={ref}
        template="minimal-circles"
        viewBoxWidth={960}
        viewBoxHeight={540}
        hitboxRadiusPx={18}
        initialPlayers={[makeState({ id: 'n1' })]}
      />,
    );
    const circleBefore = container.querySelector('circle');

    ref.current!.update([makeState({ id: 'n1', x: 42, y: 42 })]);
    const circleAfter = container.querySelector('circle');

    // Same DOM node reused — proves no remount happened for a plain position update.
    expect(circleAfter).toBe(circleBefore);
  });
});
