import type { PlayerMatchStatus } from '../../types';
import { BENCH_OFF_PITCH_Y, BENCH_EXIT_Y } from '../../benchSideline';
import type { PlayerRenderState } from './playerVisualTypes';

// Render-only bench entrance/exit for a bench substitute ("žolík"), shared
// by every mode (GameCanvas → local engine, OnlineGameCanvas → server
// snapshots). Pure presentation: it only reads the matchStatus the engine
// already reports and post-processes the PlayerRenderState list handed to
// PlayerRenderer — it never writes to GameState / the snapshot, never
// touches physics, and never delays a status change.
//
//   bench → temporarily_deployed (ENTER): the engine has already put the
//     substitute on the pitch at its entry spot near the bottom line. For
//     SUB_ENTER_MS the figure is drawn rising from the bench line
//     (BENCH_OFF_PITCH_Y) up to its live engine position — x always follows
//     the engine, y converges onto it, so it never lags behind more than
//     the short entry distance and ends exactly on the real position.
//   temporarily_deployed → bench (EXIT): the engine has already taken it out
//     (no collisions, no ball, not selectable). A ghost copy of its last
//     drawn figure — dimmed (isRemoved), never active / never "has ball" —
//     runs straight down off the canvas and is then dropped.
//
// The first time a player is seen, its status is only recorded (a late
// join / reconnect / a fresh restart never plays a fake entrance), and a
// repeated snapshot with the same status changes nothing.

export const SUB_ENTER_MS = 600;
export const SUB_EXIT_MIN_MS = 500;
export const SUB_EXIT_MAX_MS = 800;
// Exit run speed (px per ms) used to size the exit duration to the actual
// distance, clamped into [SUB_EXIT_MIN_MS, SUB_EXIT_MAX_MS].
const SUB_EXIT_SPEED = 0.5;

export interface SubstitutionStatusInput {
  id: string;
  // Missing on snapshots from an older backend — treated like 'field'.
  matchStatus?: PlayerMatchStatus;
}

type Anim =
  | { kind: 'enter'; startedAt: number }
  | { kind: 'exit'; startedAt: number; durationMs: number; from: PlayerRenderState };

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;

export function createSubstitutionAnimator() {
  const seenStatus = new Map<string, PlayerMatchStatus>();
  const lastDrawn = new Map<string, PlayerRenderState>();
  const anims = new Map<string, Anim>();

  return function animateSubstitutions(
    statuses: ReadonlyArray<SubstitutionStatusInput>,
    states: PlayerRenderState[],
    now: number,
  ): PlayerRenderState[] {
    const present = new Set<string>();
    for (const s of statuses) {
      present.add(s.id);
      const status = s.matchStatus ?? 'field';
      const prev = seenStatus.get(s.id);
      seenStatus.set(s.id, status);
      if (prev === undefined || prev === status) continue;
      if (prev === 'bench' && status === 'temporarily_deployed') {
        anims.set(s.id, { kind: 'enter', startedAt: now });
      } else if (prev === 'temporarily_deployed' && status === 'bench') {
        const from = lastDrawn.get(s.id);
        if (from) {
          const durationMs = Math.min(
            SUB_EXIT_MAX_MS,
            Math.max(SUB_EXIT_MIN_MS, (BENCH_EXIT_Y - from.y) / SUB_EXIT_SPEED),
          );
          anims.set(s.id, { kind: 'exit', startedAt: now, durationMs, from });
        } else {
          anims.delete(s.id);
        }
      } else {
        anims.delete(s.id);
      }
    }
    // Players that vanished from the source entirely (new match, dropped
    // connection) take their bookkeeping — and any ghost — with them.
    for (const id of [...seenStatus.keys()]) {
      if (present.has(id)) continue;
      seenStatus.delete(id);
      lastDrawn.delete(id);
      anims.delete(id);
    }

    const out: PlayerRenderState[] = [];
    const drawnIds = new Set<string>();
    for (const st of states) {
      drawnIds.add(st.id);
      let drawn = st;
      const a = anims.get(st.id);
      if (a?.kind === 'enter') {
        const t = (now - a.startedAt) / SUB_ENTER_MS;
        if (t >= 1 || t < 0) {
          anims.delete(st.id);
        } else {
          const y = BENCH_OFF_PITCH_Y + (st.y - BENCH_OFF_PITCH_Y) * easeOut(t);
          drawn = {
            ...st,
            y,
            vy: -1,
            isMoving: true,
            orientation: 'back',
            // Drawn away from its real spot only for a moment — don't show
            // a "has ball" cue at the figure's temporary position.
            hasBall: false,
          };
        }
      } else if (a?.kind === 'exit') {
        // Back on the pitch while its ghost was still running — the engine
        // wins, drop the ghost.
        anims.delete(st.id);
      }
      lastDrawn.set(st.id, drawn);
      out.push(drawn);
    }

    for (const [id, a] of anims) {
      if (a.kind !== 'exit' || drawnIds.has(id)) continue;
      const t = (now - a.startedAt) / a.durationMs;
      if (t >= 1 || t < 0) {
        anims.delete(id);
        continue;
      }
      out.push({
        ...a.from,
        y: a.from.y + (BENCH_EXIT_Y - a.from.y) * easeIn(t),
        vx: 0,
        vy: 1,
        isMoving: true,
        orientation: 'front',
        isActive: false,
        isCharging: false,
        chargeProgress: 0,
        isKicking: false,
        hasBall: false,
        isRemoved: true,
      });
    }
    return out;
  };
}

export type SubstitutionAnimator = ReturnType<typeof createSubstitutionAnimator>;
