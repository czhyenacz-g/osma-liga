import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PlayerRenderState } from './playerVisualTypes';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';
import PlayerVisualContainer, { type PlayerVisualContainerHandle } from './PlayerVisualContainer';
import { PLAYER_VISUAL_CONFIG } from './playerVisualConfig';
import BallOverlay from './shared/BallOverlay';
import './shared/playerVisualAnimations.css';

export interface PlayerRendererHandle {
  // Called once per host animation frame by the game canvas — pushes fresh
  // positions/animation flags straight to each player's DOM refs. No React
  // state update happens here, so this never triggers a re-render.
  // `ball` (render position + the canvas's cosmetic rotation) is only used
  // by svg-footballers-v5 to keep the ball readable over a player's body.
  update(states: PlayerRenderState[], ball?: BallRenderState): void;
  // Hides/shows the whole overlay via a direct style write (no React state,
  // same reasoning as update() above). This SVG is stacked on top of the
  // field canvas, so during full-screen canvas overlays that are drawn
  // *underneath* it (goal celebration, match-end panel — see
  // renderGame.ts/OnlineGameCanvas.tsx "Goal overlay"/"End overlay"), the
  // still-animating player icons would otherwise float above the darkened
  // backdrop and cover the announcement text. Callers hide this overlay for
  // the duration of those phases and restore it once play resumes.
  setVisible(visible: boolean): void;
}

export interface BallRenderState {
  x: number;
  y: number;
  rotation: number;
}

// v5 drawing extent in template units (SvgFootballerPlayerV5: arms ±12,
// hair top -31, boots +15.6) plus the ball's own radius in px.
const V5_BODY = { halfWidth: 12, top: 31, bottom: 15.6, ballPad: 9 };

// True when the ball overlaps any player's v5 drawing.
function ballUnderPlayer(states: PlayerRenderState[], ball: BallRenderState, scale: number): boolean {
  return states.some((s) => {
    if (s.isRemoved) return false;
    const k = scale * s.sizeScale;
    const dx = Math.abs(ball.x - s.x);
    const dy = ball.y - s.y;
    return (
      dx < V5_BODY.halfWidth * k + V5_BODY.ballPad &&
      dy > -V5_BODY.top * k - V5_BODY.ballPad &&
      dy < V5_BODY.bottom * k + V5_BODY.ballPad
    );
  });
}

export interface PlayerRendererProps {
  template: PlayerVisualTemplate;
  viewBoxWidth: number;
  viewBoxHeight: number;
  hitboxRadiusPx: number;
  initialPlayers: PlayerRenderState[];
  className?: string;
}

const OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

// Shared player-rendering surface used by every game mode (single-player bot
// engine and online multiplayer alike) — an SVG overlay laid on top of the
// existing field/ball canvas (see GameCanvas.tsx / OnlineGameCanvas.tsx),
// sized via viewBox so it scales 1:1 with the canvas's own CSS box without
// any manual resize math. The canvas keeps drawing the field, ball, and HUD
// exactly as before; only player rendering moved here.
const PlayerRenderer = forwardRef<PlayerRendererHandle, PlayerRendererProps>(
  function PlayerRenderer({ template, viewBoxWidth, viewBoxHeight, hitboxRadiusPx, initialPlayers, className }, ref) {
    // The SET of player ids on the pitch only changes on match start/restart
    // or a temporary-removal substitution — rare enough that plain React
    // state (and a normal re-render of this list) is fine. Per-frame
    // position/animation data never flows through this state.
    const [players, setPlayers] = useState(initialPlayers);
    const containerRefs = useRef(new Map<string, PlayerVisualContainerHandle>());
    const svgRef = useRef<SVGSVGElement>(null);
    const ballRef = useRef<SVGGElement>(null);
    const showsBallOverlay = template === 'svg-footballers-v5';

    useImperativeHandle(ref, () => ({
      update(states: PlayerRenderState[], ball?: BallRenderState) {
        const currentIds = new Set(players.map((p) => p.id));
        const nextIds = new Set(states.map((s) => s.id));
        let idsChanged = currentIds.size !== nextIds.size;
        if (!idsChanged) {
          for (const id of nextIds) {
            if (!currentIds.has(id)) { idsChanged = true; break; }
          }
        }
        if (idsChanged) {
          setPlayers(states);
        }

        for (const state of states) {
          containerRefs.current.get(state.id)?.update(state);
        }

        const ballEl = ballRef.current;
        if (ballEl && ball) {
          const visible = ballUnderPlayer(states, ball, PLAYER_VISUAL_CONFIG['svg-footballers-v5'].visualRadiusScale);
          ballEl.setAttribute('opacity', visible ? '1' : '0');
          if (visible) ballEl.setAttribute('transform', `translate(${ball.x} ${ball.y}) rotate(${(ball.rotation * 180) / Math.PI})`);
        }
      },
      setVisible(visible: boolean) {
        if (svgRef.current) svgRef.current.style.opacity = visible ? '1' : '0';
      },
    }));

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={OVERLAY_STYLE}
        className={className}
        aria-hidden="true"
      >
        {players.map((p) => (
          <PlayerVisualContainer
            key={p.id}
            ref={(el) => {
              if (el) containerRefs.current.set(p.id, el);
              else containerRefs.current.delete(p.id);
            }}
            template={template}
            team={p.team}
            label={p.label}
            primaryColor={p.primaryColor}
            secondaryColor={p.secondaryColor}
            hitboxRadiusPx={hitboxRadiusPx}
            isGoalkeeper={p.isGoalkeeper}
            sizeScale={p.sizeScale}
          />
        ))}
        {showsBallOverlay && <BallOverlay ref={ballRef} />}
      </svg>
    );
  },
);

export default PlayerRenderer;
