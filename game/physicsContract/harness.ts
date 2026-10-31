import type { GameState, InputState } from '../types';
import { createInitialState } from '../createInitialState';
import { updateGame } from '../updateGame';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG, updateTemporaryRemovals } from '../temporaryRemoval';
import { deployBenchPlayer, updateBenchDeployments } from '../benchDeployment';
import { BALL_CONTROL_RADIUS, BALL_RADIUS, PLAYER_RADIUS } from '../constants';
import type { GameplayProfile } from '../gameplayProfiles';
import type { ContractMetrics, ContractScenario } from './spec';
import { runContractScenario } from './runner';

// Local-engine (updateGame) adapter for the physics contract. Test-only —
// never imported by the app.

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };

export function runLocalContractScenario(
  sc: ContractScenario,
  hz: number,
  profile: GameplayProfile = 'classic',
  // Optional per-step probe into the live state (tests only).
  observe?: (state: GameState, playerId: string) => void,
): ContractMetrics {
  const dt = 1 / hz;
  if (sc.kind === 'bench') return runBench(dt);
  if (sc.kind === 'removal') return runRemoval(dt);

  // One home field player + the ball; every other field player is parked
  // off the pitch, the away GK only stays when the scenario asks for it.
  let state = createInitialState(NO_REMOVALS);
  state.gameplayProfile = profile;
  const me = state.players.find((p) => p.team === 'home' && p.role === 'field_player' && p.matchStatus === 'field')!;
  const [def, def2] = state.players.filter((p) => p.team === 'away' && p.role === 'field_player' && p.matchStatus === 'field');
  for (const p of state.players) {
    const keep = p === me || (sc.defender && p === def) || (sc.defender2 && p === def2)
      || (sc.goalkeeper && p.role === 'goalkeeper' && p.team === 'away');
    if (!keep) { p.matchStatus = 'bench'; p.pos = { x: -500, y: -500 }; }
  }
  me.pos = { ...sc.start };
  state.activePlayerId = me.id;
  state.ball.pos = { x: sc.start.x + sc.ball.x, y: sc.start.y + sc.ball.y };
  state.ball.vel = { ...(sc.ballVel ?? { x: 0, y: 0 }) };
  const defPos = sc.defender ? { x: sc.start.x + sc.defender.x, y: sc.start.y + sc.defender.y } : null;
  const defPos2 = sc.defender2 ? { x: sc.start.x + sc.defender2.x, y: sc.start.y + sc.defender2.y } : null;
  const find = (id: string) => state.players.find((p) => p.id === id)!;

  return runContractScenario(sc, {
    step(i, stepDt) {
      const input: InputState = {
        up: !!i.up, down: !!i.down, left: !!i.left, right: !!i.right, kick: !!i.kick,
        restart: false, switchPlayer: false,
      };
      state = updateGame(state, input, stepDt, NO_REMOVALS, undefined, { disableOpponentAI: true });
      // Static defender — same in both harnesses.
      if (defPos) { const d = find(def.id); d.pos = { ...defPos }; d.vel = { x: 0, y: 0 }; }
      if (defPos2) { const d = find(def2.id); d.pos = { ...defPos2 }; d.vel = { x: 0, y: 0 }; }
      observe?.(state, me.id);
    },
    player: () => find(me.id).pos,
    ball: () => ({ ...state.ball.pos, vx: state.ball.vel.x, vy: state.ball.vel.y }),
    defenders: () => [defPos && find(def.id).pos, defPos2 && find(def2.id).pos].filter((p): p is NonNullable<typeof p> => !!p),
    scored: () => state.phase === 'goal',
    controlRadius: BALL_CONTROL_RADIUS,
    contactDist: PLAYER_RADIUS + BALL_RADIUS,
  }, dt);
}

const round = (v: number) => Math.round(v * 10) / 10;

// Žolík: entry spot, how long it stays on, and that it is spent afterwards.
function runBench(dt: number): ContractMetrics {
  const state = createInitialState(NO_REMOVALS);
  const sub = state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
  deployBenchPlayer(state, 'home', sub.id, 'attacker');
  const entry = { ...sub.pos };
  let t = 0;
  while (sub.matchStatus !== 'bench' && t < 40) { updateBenchDeployments(state, dt); t += dt; }
  return { playerX: round(entry.x), playerY: round(entry.y), benchSeconds: round(t), contacts: sub.benchUsed ? 1 : 0, at: {} };
}

// Temporary weakening: time spent on the bench and where the player ends up.
function runRemoval(dt: number): ContractMetrics {
  const state = createInitialState(DEFAULT_TEMPORARY_REMOVAL_CONFIG);
  state.randomSubstitutionTriggerSecond = { home: 0, away: 1e9 };
  updateTemporaryRemovals(state, dt, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
  const removal = state.temporaryRemovals[0];
  if (!removal) return { benchSeconds: -1, at: {} };
  const p = state.players.find((x) => x.id === removal.playerId)!;
  let bench = 0, maxY = -Infinity, guard = 0;
  while (state.temporaryRemovals.length && guard++ < 100_000) {
    if (state.temporaryRemovals[0].phase === 'bench') bench += dt;
    maxY = Math.max(maxY, p.pos.y);
    updateTemporaryRemovals(state, dt, DEFAULT_TEMPORARY_REMOVAL_CONFIG);
  }
  return { benchSeconds: round(bench), playerX: round(p.pos.x), playerY: round(p.pos.y), maxPlayerY: round(maxY), at: {} };
}
