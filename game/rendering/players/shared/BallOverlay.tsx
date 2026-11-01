import { forwardRef } from 'react';
import { BALL_RADIUS } from '../../../constants';
import { BALL_VISUAL_RADIUS_SCALE } from '../../ball/drawFootball';

// svg-footballers-v5: the ball is drawn on the canvas UNDER the SVG player
// overlay, so a player standing right on it (dribbling upward, the ball at
// the feet) would hide it. PlayerRenderer shows this copy of the ball ABOVE
// the players only while the ball overlaps a player's drawing — same shape
// as drawFootball.ts (base, pentagon, seams with corner patches), same
// position and rotation, so the swap is invisible. Purely visual: position
// comes from the caller's existing ball render position, nothing is read
// from or written to the game state.
const R = BALL_RADIUS * BALL_VISUAL_RADIUS_SCALE;
const PANEL_COLOR = '#16201a';

function polar(angle: number, radius: number): [number, number] {
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

const ANGLES = [0, 1, 2, 3, 4].map((i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5);
const PENTAGON = ANGLES.map((a) => polar(a, R * 0.42).join(',')).join(' ');

const BallOverlay = forwardRef<SVGGElement>(function BallOverlay(_props, ref) {
  return (
    <g ref={ref} opacity={0} className="player-visual-ball-overlay">
      <circle r={R} fill="#f4f4f0" stroke="rgba(15,23,18,0.55)" strokeWidth={Math.max(1, R * 0.14)} />
      <polygon points={PENTAGON} fill={PANEL_COLOR} />
      {ANGLES.map((a, i) => {
        const [sx, sy] = polar(a, R * 0.42);
        const [ex, ey] = polar(a, R * 0.92);
        return (
          <g key={i}>
            <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={PANEL_COLOR} strokeWidth={Math.max(0.8, R * 0.1)} />
            <circle cx={ex} cy={ey} r={R * 0.13} fill={PANEL_COLOR} />
          </g>
        );
      })}
      <circle cx={-R * 0.32} cy={-R * 0.32} r={R * 0.22} fill="rgba(255,255,255,0.55)" />
    </g>
  );
});

export default BallOverlay;
