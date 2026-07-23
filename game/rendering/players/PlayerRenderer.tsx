import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { PlayerRenderState } from './playerVisualTypes';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';
import PlayerVisualContainer, { type PlayerVisualContainerHandle } from './PlayerVisualContainer';
import './shared/playerVisualAnimations.css';

export interface PlayerRendererHandle {
  // Called once per host animation frame by the game canvas — pushes fresh
  // positions/animation flags straight to each player's DOM refs. No React
  // state update happens here, so this never triggers a re-render.
  update(states: PlayerRenderState[]): void;
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

    useImperativeHandle(ref, () => ({
      update(states: PlayerRenderState[]) {
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
      },
    }));

    return (
      <svg
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
          />
        ))}
      </svg>
    );
  },
);

export default PlayerRenderer;
