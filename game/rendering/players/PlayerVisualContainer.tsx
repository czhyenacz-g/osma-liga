import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { PlayerRenderState, PlayerTeam } from './playerVisualTypes';
import type { PlayerVisualTemplate } from '../../presentation/playerVisualTemplate';
import { resolvePlayerVisualComponent, usesSharedActiveIndicator } from './playerVisualRegistry';
import { PLAYER_VISUAL_CONFIG } from './playerVisualConfig';
import ActivePlayerRing from './shared/ActivePlayerRing';
import LegacyPlayerVisual, { type LegacyPlayerVisualHandle } from './templates/LegacyPlayerVisual';

export interface PlayerVisualContainerHandle {
  update(state: PlayerRenderState): void;
}

export interface PlayerVisualContainerProps {
  template: PlayerVisualTemplate;
  team: PlayerTeam;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  hitboxRadiusPx: number;
}

// A charge past this fraction gets the extra "almost fully charged" vibrate
// (see playerVisualAnimations.css .is-almost-charged).
const ALMOST_CHARGED_THRESHOLD = 0.85;

// The one shared container every template is drawn through, for every game
// mode. Owns exactly the 4 transform layers described in the task:
//   1. outer  — position on the pitch (translate)
//   2. direction — mirrors ONLY the character graphic (scaleX ±1)
//   3. animation — hop/step/charge-scale/kick, driven by boolean classes + a
//      continuous charge-scale value, both written imperatively per frame
//   4. UI — active-player ring (+ future name/indicators), a SIBLING of the
//      direction wrapper so it is never mirrored with the character
//
// All per-frame writes are plain DOM attribute/className assignments on
// cached refs — there is no React re-render, no state, no VDOM diff per
// frame. React only re-renders this component if `template` changes (the
// user picked a different visual style), which is rare and cheap.
const PlayerVisualContainer = forwardRef<PlayerVisualContainerHandle, PlayerVisualContainerProps>(
  function PlayerVisualContainer({ template, team, label, primaryColor, secondaryColor, hitboxRadiusPx }, ref) {
    const outerRef = useRef<SVGGElement>(null);
    const directionRef = useRef<SVGGElement>(null);
    const animationRef = useRef<SVGGElement>(null);
    const uiRef = useRef<SVGGElement>(null);
    const ringRef = useRef<SVGEllipseElement>(null);
    const legacyRef = useRef<LegacyPlayerVisualHandle>(null);

    const config = PLAYER_VISUAL_CONFIG[template];
    const TemplateComponent = resolvePlayerVisualComponent(template);
    // Legacy's charge/active feedback is fundamentally different (the RING
    // grows, not the body) and fully self-contained — see
    // LegacyPlayerVisual.tsx. Every other template shares this container's
    // ActivePlayerRing + charge-scale mechanism instead.
    const sharedActive = usesSharedActiveIndicator(template);

    useImperativeHandle(ref, () => ({
      update(state: PlayerRenderState) {
        const outer = outerRef.current;
        const direction = directionRef.current;
        const animation = animationRef.current;
        if (!outer || !direction || !animation) return;

        outer.setAttribute('transform', `translate(${state.x} ${state.y})`);
        direction.setAttribute('transform', `scale(${state.facingDirection} 1)`);

        if (sharedActive) {
          const chargeGrowth = 1 + state.chargeProgress * (config.maxChargeScale - 1);
          animation.setAttribute('transform', `scale(${config.visualRadiusScale * chargeGrowth})`);
          animation.style.setProperty('--step-duration', `${config.stepDurationMs}ms`);

          const classes = ['player-visual-anim'];
          if (template === 'pixel-characters') classes.push('pixel-player');
          if (state.isMoving) classes.push('is-moving');
          if (state.isCharging) classes.push('is-charging');
          if (state.isCharging && state.chargeProgress >= ALMOST_CHARGED_THRESHOLD) classes.push('is-almost-charged');
          if (state.isKicking) classes.push('is-kicking');
          animation.setAttribute('class', classes.join(' '));
          animation.setAttribute('opacity', state.isRemoved ? '0.45' : '1');

          const ui = uiRef.current;
          const ringEl = ringRef.current;
          if (ui && ringEl) {
            if (state.isActive) {
              const rx = hitboxRadiusPx * 1.6 + state.chargeProgress * 10;
              const ry = hitboxRadiusPx * 0.7 + state.chargeProgress * 4;
              ringEl.setAttribute('rx', String(rx));
              ringEl.setAttribute('ry', String(ry));
              ui.setAttribute('opacity', '1');
            } else {
              ui.setAttribute('opacity', '0');
            }
          }
        } else {
          animation.setAttribute('transform', 'scale(1)');
          legacyRef.current?.update(state);
        }
      },
    }));

    return (
      <g ref={outerRef}>
        {sharedActive && (
          <g ref={uiRef} opacity={0}>
            <ActivePlayerRing ref={ringRef} rx={hitboxRadiusPx * 1.6} ry={hitboxRadiusPx * 0.7} />
          </g>
        )}
        <g ref={directionRef}>
          <g ref={animationRef} className="player-visual-anim">
            {template === 'legacy' ? (
              <LegacyPlayerVisual
                ref={legacyRef}
                team={team}
                label={label}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                hitboxRadiusPx={hitboxRadiusPx}
              />
            ) : (
              <TemplateComponent
                team={team}
                label={label}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                hitboxRadiusPx={hitboxRadiusPx}
              />
            )}
          </g>
        </g>
      </g>
    );
  },
);

export default PlayerVisualContainer;
