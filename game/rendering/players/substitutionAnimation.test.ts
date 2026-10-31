import { describe, it, expect } from 'vitest';
import { createSubstitutionAnimator, SUB_ENTER_MS, SUB_EXIT_MAX_MS } from './substitutionAnimation';
import { resolveBotPlayerRenderStates, resolveOnlinePlayerRenderStates, createFacingDirectionTracker } from './resolvePlayerRenderState';
import type { OnlineRenderPlayerInput } from './resolvePlayerRenderState';
import { createInitialState } from '../../createInitialState';
import { updateGame } from '../../updateGame';
import { deployBenchPlayer, isSelectableFieldPlayer } from '../../benchDeployment';
import { DEFAULT_TEMPORARY_REMOVAL_CONFIG } from '../../temporaryRemoval';
import { BENCH_OFF_PITCH_Y, BENCH_EXIT_Y, BENCH_SIDELINE_Y } from '../../benchSideline';
import { BENCH_DEPLOY_DURATION_MS } from '../../constants';
import type { BenchRole, GameState, InputState, Team } from '../../types';

const NO_REMOVALS = { ...DEFAULT_TEMPORARY_REMOVAL_CONFIG, enabled: false };
const DT = 1 / 60;
const FRAME_MS = 1000 / 60;

function noInput(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false, switchPlayer: false };
}

// Local engine + animator, frame by frame, exactly like GameCanvas.tsx.
function localHarness() {
  let state: GameState = createInitialState(NO_REMOVALS);
  const facing = createFacingDirectionTracker();
  const animate = createSubstitutionAnimator();
  let now = 0;
  const frame = () => {
    state = updateGame(state, noInput(), DT);
    now += FRAME_MS;
    return animate(state.players, resolveBotPlayerRenderStates(state, facing), now);
  };
  // First frame records the starting statuses (no animation).
  animate(state.players, resolveBotPlayerRenderStates(state, facing), now);
  return { get state() { return state; }, frame };
}

describe('žolík entrance — comes on from the bottom touchline (local engine)', () => {
  for (const team of ['home', 'away'] as Team[]) {
    for (const role of ['attacker', 'defender'] as BenchRole[]) {
      it(`${team} ${role}: first drawn at the bench line, rises up onto its real position within ${SUB_ENTER_MS} ms`, () => {
        const h = localHarness();
        const sub = h.state.players.find((p) => p.team === team && p.matchStatus === 'bench')!;
        expect(deployBenchPlayer(h.state, team, sub.id, role)).toBe(true);

        const ys: number[] = [];
        let realY = 0;
        for (let i = 0; i < Math.ceil(SUB_ENTER_MS / FRAME_MS) + 2; i++) {
          const drawn = h.frame().find((s) => s.id === sub.id)!;
          ys.push(drawn.y);
          realY = h.state.players.find((p) => p.id === sub.id)!.pos.y;
        }
        // Starts just below the bottom line (not teleported into place)…
        expect(ys[0]).toBeGreaterThan(BENCH_SIDELINE_Y);
        expect(ys[0]).toBeLessThanOrEqual(BENCH_OFF_PITCH_Y);
        // …moves upward every frame of the entrance, no jumps…
        for (let i = 1; i < ys.length - 2; i++) {
          expect(ys[i]).toBeLessThanOrEqual(ys[i - 1] + 0.5);
          expect(ys[i - 1] - ys[i]).toBeLessThan(25);
        }
        // …and ends exactly on the engine's position.
        expect(ys[ys.length - 1]).toBeCloseTo(realY, 5);
      });
    }
  }

  it('the engine position is untouched by the animation (physics sees the real spot)', () => {
    const h = localHarness();
    const sub = h.state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(h.state, 'home', sub.id, 'attacker');
    const drawn = h.frame().find((s) => s.id === sub.id)!;
    const real = h.state.players.find((p) => p.id === sub.id)!;
    expect(real.pos.y).toBeLessThan(BENCH_SIDELINE_Y);
    expect(drawn.y).toBeGreaterThan(real.pos.y);
    expect(drawn.x).toBe(real.pos.x);
  });
});

describe('žolík exit after 30 s — runs down off the pitch (local engine)', () => {
  it('leaves the game immediately, the ghost runs down and disappears within the exit window', () => {
    const h = localHarness();
    const sub = h.state.players.find((p) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(h.state, 'home', sub.id, 'defender');
    let frames = Math.ceil(BENCH_DEPLOY_DURATION_MS / FRAME_MS) - 30;
    let lastOnPitch = h.frame();
    while (frames-- > 0) lastOnPitch = h.frame();
    const lastY = lastOnPitch.find((s) => s.id === sub.id)!.y;

    // Run until the engine expires it.
    let out = h.frame();
    let guard = 0;
    while (h.state.players.find((p) => p.id === sub.id)!.matchStatus !== 'bench' && guard++ < 120) out = h.frame();
    const player = h.state.players.find((p) => p.id === sub.id)!;

    // Gameplay ends exactly at 30 s — not prolonged by the animation.
    expect(player.matchStatus).toBe('bench');
    expect(h.state.benchDeployments).toHaveLength(0);
    expect(isSelectableFieldPlayer(player, new Set())).toBe(false);
    expect(h.state.activePlayerId).not.toBe(sub.id);

    // The ghost: dimmed, not active, no ball, below its last spot and moving down.
    const ghost = out.find((s) => s.id === sub.id)!;
    expect(ghost).toBeDefined();
    expect(ghost.isRemoved).toBe(true);
    expect(ghost.isActive).toBe(false);
    expect(ghost.hasBall).toBe(false);
    expect(ghost.y).toBeGreaterThanOrEqual(lastY - 5);

    const ghostYs: number[] = [];
    for (let i = 0; i < Math.ceil(SUB_EXIT_MAX_MS / FRAME_MS) + 2; i++) {
      const g = h.frame().find((s) => s.id === sub.id);
      if (g) ghostYs.push(g.y);
    }
    for (let i = 1; i < ghostYs.length; i++) expect(ghostYs[i]).toBeGreaterThanOrEqual(ghostYs[i - 1]);
    expect(ghostYs.length).toBeGreaterThan(20); // ~0.5 s+ visible, not a pop
    // Gone afterwards.
    expect(h.frame().find((s) => s.id === sub.id)).toBeUndefined();
  });
});

describe('online snapshots drive the same animation', () => {
  function snapPlayers(status: Record<string, OnlineRenderPlayerInput['matchStatus']>, y = 300): OnlineRenderPlayerInput[] {
    return Object.entries(status).map(([id, matchStatus]) => ({
      id, team: id.startsWith('h') ? 'home' : 'away', label: id, rx: 400, ry: y, pvx: 0, pvy: 0, active: false, matchStatus,
    }));
  }
  const run = (animate: ReturnType<typeof createSubstitutionAnimator>, players: OnlineRenderPlayerInput[], now: number) =>
    animate(players, resolveOnlinePlayerRenderStates(players, { x: 0, y: 0 }, 'home', 0, createFacingDirectionTracker()), now);

  it('bench → temporarily_deployed in a snapshot starts the entrance from the bench line', () => {
    const animate = createSubstitutionAnimator();
    run(animate, snapPlayers({ h1: 'field', 'a-bench-0': 'bench' }), 0);
    const out = run(animate, snapPlayers({ h1: 'field', 'a-bench-0': 'temporarily_deployed' }, 450), 16);
    expect(out.find((s) => s.id === 'a-bench-0')!.y).toBeGreaterThan(BENCH_SIDELINE_Y);
  });

  it('temporarily_deployed → bench starts the exit ghost', () => {
    const animate = createSubstitutionAnimator();
    run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }), 0);
    const out = run(animate, snapPlayers({ 'h-bench-0': 'bench' }), 16);
    const ghost = out.find((s) => s.id === 'h-bench-0')!;
    expect(ghost.isRemoved).toBe(true);
    const later = run(animate, snapPlayers({ 'h-bench-0': 'bench' }), 316);
    expect(later.find((s) => s.id === 'h-bench-0')!.y).toBeGreaterThan(ghost.y);
    expect(run(animate, snapPlayers({ 'h-bench-0': 'bench' }), 16 + SUB_EXIT_MAX_MS + 1).find((s) => s.id === 'h-bench-0')).toBeUndefined();
  });

  it('late join: a substitute already on the pitch in the first snapshot is drawn in place, no fake entrance', () => {
    const animate = createSubstitutionAnimator();
    const out = run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }, 300), 0);
    expect(out[0].y).toBe(300);
    expect(run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }, 300), 16)[0].y).toBe(300);
  });

  it('a duplicate snapshot does not restart the entrance', () => {
    const animate = createSubstitutionAnimator();
    run(animate, snapPlayers({ 'h-bench-0': 'bench' }), 0);
    run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }, 450), 0);
    // Repeated identical snapshots after the entrance window: drawn in place.
    for (const t of [SUB_ENTER_MS + 10, SUB_ENTER_MS + 20, SUB_ENTER_MS + 30]) {
      expect(run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }, 450), t)[0].y).toBe(450);
    }
  });

  it('dropped connection / players gone from the source: no ghost is left behind', () => {
    const animate = createSubstitutionAnimator();
    run(animate, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }), 0);
    run(animate, snapPlayers({ 'h-bench-0': 'bench' }), 16);
    expect(run(animate, [], 32)).toEqual([]);
    // And ghosts always expire on their own even if snapshots stop changing.
    const a2 = createSubstitutionAnimator();
    run(a2, snapPlayers({ 'h-bench-0': 'temporarily_deployed' }), 0);
    run(a2, snapPlayers({ 'h-bench-0': 'bench' }), 16);
    expect(run(a2, snapPlayers({ 'h-bench-0': 'bench' }), 5000)).toEqual([]);
  });

  it('older backend without matchStatus: nothing animates', () => {
    const animate = createSubstitutionAnimator();
    const p = snapPlayers({ h1: undefined }, 200);
    run(animate, p, 0);
    expect(run(animate, p, 16)[0].y).toBe(200);
  });

  it('exit target is fully below the visible canvas', () => {
    expect(BENCH_EXIT_Y).toBeGreaterThan(540);
  });
});
