import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from 'react';
import PlayerVisualContainer, { type PlayerVisualContainerHandle } from './PlayerVisualContainer';
import type { PlayerRenderState } from './playerVisualTypes';

function makeState(overrides: Partial<PlayerRenderState> = {}): PlayerRenderState {
  return {
    id: 'n1',
    team: 'home',
    label: 'N1',
    x: 0,
    y: 0,
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

describe('PlayerVisualContainer — pixel-characters / minimal-circles (shared active indicator)', () => {
  it('grows the animation wrapper scale with chargeProgress, without ever changing position', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer
          ref={ref}
          template="pixel-characters"
          team="home"
          label="N1"
          primaryColor="#22c55e"
          secondaryColor="#15803d"
          hitboxRadiusPx={18}
        />
      </svg>,
    );

    ref.current!.update(makeState({ x: 200, y: 150, isActive: true, isCharging: true, chargeProgress: 0 }));
    const animGroup = container.querySelector('.player-visual-anim.pixel-player')!;
    const scaleAtZero = animGroup.getAttribute('transform');

    ref.current!.update(makeState({ x: 200, y: 150, isActive: true, isCharging: true, chargeProgress: 1 }));
    const scaleAtFull = animGroup.getAttribute('transform');

    expect(scaleAtZero).not.toBe(scaleAtFull);
    const outer = container.querySelector('svg > g')!;
    // Position (outer wrapper) never moves as a side effect of charging.
    expect(outer.getAttribute('transform')).toBe('translate(200 150)');
  });

  it('shows the shared gold ring only while the player is active', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer
          ref={ref}
          template="minimal-circles"
          team="home"
          label="N1"
          primaryColor="#22c55e"
          secondaryColor="#15803d"
          hitboxRadiusPx={18}
        />
      </svg>,
    );

    ref.current!.update(makeState({ isActive: false }));
    const uiGroup = container.querySelector('ellipse')!.parentElement!;
    expect(uiGroup.getAttribute('opacity')).toBe('0');

    ref.current!.update(makeState({ isActive: true }));
    expect(uiGroup.getAttribute('opacity')).toBe('1');
  });

  it('mirrors only the direction wrapper (character), never the UI wrapper (ring)', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer
          ref={ref}
          template="minimal-circles"
          team="home"
          label="N1"
          primaryColor="#22c55e"
          secondaryColor="#15803d"
          hitboxRadiusPx={18}
        />
      </svg>,
    );

    ref.current!.update(makeState({ isActive: true, facingDirection: -1 }));
    const groups = container.querySelectorAll('svg > g > g');
    // First child <g> of the outer wrapper is the UI wrapper (a sibling of
    // direction), which must never carry the direction's mirror transform.
    const uiWrapper = container.querySelector('svg > g > g')!;
    expect(uiWrapper.getAttribute('transform')).not.toBe('scale(-1 1)');
    // The direction wrapper itself does get mirrored.
    const directionWrapper = [...groups].find((g) => g.getAttribute('transform') === 'scale(-1 1)');
    expect(directionWrapper).toBeDefined();
  });
});

describe('PlayerVisualContainer — legacy (self-contained, no shared charge-scale)', () => {
  it('never scales the animation wrapper for legacy — charge feedback is the ring, not the body', () => {
    const ref = createRef<PlayerVisualContainerHandle>();
    const { container } = render(
      <svg>
        <PlayerVisualContainer
          ref={ref}
          template="legacy"
          team="home"
          label="N1"
          primaryColor="#22c55e"
          secondaryColor="#15803d"
          hitboxRadiusPx={18}
        />
      </svg>,
    );

    ref.current!.update(makeState({ isActive: true, isCharging: true, chargeProgress: 1 }));
    const animGroup = container.querySelector('.player-visual-anim')!;
    expect(animGroup.getAttribute('transform')).toBe('scale(1)');
  });

  it('does not render the shared ActivePlayerRing UI wrapper at all', () => {
    const { container } = render(
      <svg>
        <PlayerVisualContainer
          template="legacy"
          team="home"
          label="N1"
          primaryColor="#22c55e"
          secondaryColor="#15803d"
          hitboxRadiusPx={18}
        />
      </svg>,
    );
    // Legacy draws its own ring inside LegacyPlayerVisual (a plain <circle>),
    // not the shared <ellipse>-based ActivePlayerRing.
    expect(container.querySelector('ellipse')).toBeNull();
  });
});
