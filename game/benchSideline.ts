import type { Team, Vec2 } from './types';
import { FIELD_B, FIELD_CX, CANVAS_H, PLAYER_RADIUS } from './constants';

// The bench is at the BOTTOM touchline (FIELD_B) for both teams in every
// mode — the bench controls (BenchPanel) sit below the pitch too, so players
// visibly come on from below and leave downwards. Home bench on the left,
// away bench on the right of the halfway line, close enough to the middle
// that nobody crosses the whole pitch just to come off. Logical (engine)
// coordinates — the canvas and the player SVG overlay scale them 1:1 via
// CANVAS_W/CANVAS_H, independent of CSS size. Mirrors
// project-hub-api/src/gameEngine/benchSideline.ts.

export const BENCH_SIDELINE_Y = FIELD_B;

// Where a player who is off the pitch at the bench stands (and is drawn):
// just past the bottom line, inside the canvas's bottom margin
// (CANVAS_H - FIELD_B = 30px), so it's still visible while it sits out.
export const BENCH_OFF_PITCH_Y = FIELD_B + 18;

// Fully below the visible canvas — where a player leaving the pitch for good
// (render-only exit animation) runs to before it disappears.
export const BENCH_EXIT_Y = CANVAS_H + PLAYER_RADIUS * 2;

export function getSidelineBenchSpot(team: Team): Vec2 {
  return { x: team === 'home' ? FIELD_CX - 100 : FIELD_CX + 100, y: BENCH_OFF_PITCH_Y };
}
