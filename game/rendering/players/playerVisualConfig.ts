import type { PlayerTeam } from './playerVisualTypes';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';

// Single central place for cosmetic sizing/animation numbers so no
// component hardcodes its own scale. None of these affect the physical
// hitbox (game/constants.ts PLAYER_RADIUS / project-hub-api PLAYER_RADIUS) —
// they only scale what's drawn on top of it.
export interface PlayerVisualTemplateConfig {
  // Visual radius relative to the real hitbox radius (1 = same size as the
  // hitbox). Kept close to 1 so the drawn body never meaningfully overlaps
  // neighbouring players/the ball beyond the real collision radius.
  visualRadiusScale: number;
  maxChargeScale: number;
  stepDurationMs: number;
  hopHeightPx: number;
}

export const PLAYER_VISUAL_CONFIG: Record<PlayerVisualTemplate, PlayerVisualTemplateConfig> = {
  'pixel-characters': {
    visualRadiusScale: 1.15,
    maxChargeScale: 1.2,
    stepDurationMs: 190,
    hopHeightPx: 2,
  },
  'minimal-circles': {
    visualRadiusScale: 1,
    maxChargeScale: 1.18,
    stepDurationMs: 0, // no stepping animation for this template
    hopHeightPx: 0,
  },
  legacy: {
    // Legacy draws at exactly the hitbox radius, as it always has.
    visualRadiusScale: 1,
    maxChargeScale: 1, // legacy's "growth" is the ring, not the body — see LegacyPlayerVisual.tsx
    stepDurationMs: 0,
    hopHeightPx: 0,
  },
};

export const TEAM_COLORS: Record<PlayerTeam, { primary: string; secondary: string }> = {
  home: { primary: '#22c55e', secondary: '#15803d' },
  away: { primary: '#3b82f6', secondary: '#1d4ed8' },
};

// Below this |vx| (px/s) we keep the last known facing direction instead of
// flipping — avoids a jittery mirror-flicker while nearly stationary.
export const FACING_DEADZONE_VX = 6;

// Above this speed (px/s) a player counts as "moving" for animation
// purposes (steps/hop). Intentionally a bit above pure-zero so tiny residual
// drift doesn't keep the stepping animation alive.
export const MOVING_SPEED_THRESHOLD = 10;

export const ACTIVE_RING_COLOR = '#fbbf24';
