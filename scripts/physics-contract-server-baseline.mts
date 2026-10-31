// Replays the physics-contract scenarios (game/physicsContract/spec.ts)
// against the SERVER engine of a local project-hub-api checkout through the
// same engine-agnostic runner, and prints server-baseline.json. Read-only:
// imports engine code, touches no server, DB or network.
//
//   npx tsx scripts/physics-contract-server-baseline.mts <path-to-project-hub-api> \
//     > game/physicsContract/server-baseline.json
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { CONTRACT_SCENARIOS } from '../game/physicsContract/spec';
import { runContractScenario } from '../game/physicsContract/runner';

const repo = resolve(process.argv[2] ?? '../project-hub-api');
const engine = (f: string) => import(resolve(repo, 'src/gameEngine', f));
const { createInitialState } = await engine('createInitialState.ts');
const { tickGame } = await engine('tick.ts');
const { DEFAULT_TEMPORARY_REMOVAL_CONFIG: REM, updateTemporaryRemovals } = await engine('temporaryRemoval.ts');
const { deployBenchPlayer, updateBenchDeployments } = await engine('benchDeployment.ts');
const { DEFAULT_BEHAVIOR_CONFIG } = await engine('teamBehavior.ts');
const C = await engine('constants.ts');
const commit = execSync('git rev-parse --short HEAD', { cwd: repo }).toString().trim();

const NOREM = { ...REM, enabled: false };
const DT = 0.033;
const idle = () => ({ up: false, down: false, left: false, right: false, kick: false, switchPlayer: false });
const round = (v: number) => Math.round(v * 10) / 10;

const out: Record<string, unknown> = {};
for (const sc of CONTRACT_SCENARIOS) {
  if (sc.kind === 'bench') {
    const st = createInitialState(NOREM);
    const sub = st.players.find((p: any) => p.team === 'home' && p.matchStatus === 'bench')!;
    deployBenchPlayer(st, 'home', sub.id, 'attacker');
    const entry = { x: sub.x, y: sub.y }; let t = 0;
    while (sub.matchStatus !== 'bench' && t < 40) { updateBenchDeployments(st, DT); t += DT; }
    out[sc.name] = { playerX: round(entry.x), playerY: round(entry.y), benchSeconds: round(t), contacts: sub.benchUsed ? 1 : 0, at: {} };
    continue;
  }
  if (sc.kind === 'removal') {
    const st = createInitialState(REM);
    st.randomSubstitutionTriggerSecond = { home: 0, away: 1e9 };
    updateTemporaryRemovals(st, DT, REM);
    const r = st.temporaryRemovals[0]; const p = st.players.find((x: any) => x.id === r.playerId)!;
    let bench = 0, maxY = -Infinity, g = 0;
    while (st.temporaryRemovals.length && g++ < 100000) {
      if (st.temporaryRemovals[0].phase === 'bench') bench += DT;
      maxY = Math.max(maxY, p.y);
      updateTemporaryRemovals(st, DT, REM);
    }
    out[sc.name] = { benchSeconds: round(bench), playerX: round(p.x), playerY: round(p.y), maxPlayerY: round(maxY), at: {} };
    continue;
  }
  const st = createInitialState(NOREM); st.status = 'playing';
  const me = st.players.find((p: any) => p.team === 'home' && p.role === 'field_player' && p.matchStatus === 'field')!;
  const [def, def2] = st.players.filter((p: any) => p.team === 'away' && p.role === 'field_player' && p.matchStatus === 'field');
  for (const p of st.players as any[]) {
    const keep = p === me || (sc.defender && p === def) || (sc.defender2 && p === def2)
      || (sc.goalkeeper && p.role === 'goalkeeper' && p.team === 'away');
    if (!keep) { p.matchStatus = 'bench'; p.x = -500; p.y = -500; p.baseX = -500; p.baseY = -500; }
  }
  me.x = sc.start.x; me.y = sc.start.y;
  st.ball.x = sc.start.x + sc.ball.x; st.ball.y = sc.start.y + sc.ball.y; st.ball.vx = sc.ballVel?.x ?? 0; st.ball.vy = sc.ballVel?.y ?? 0;
  const defPos = sc.defender ? { x: sc.start.x + sc.defender.x, y: sc.start.y + sc.defender.y } : null;
  const defPos2 = sc.defender2 ? { x: sc.start.x + sc.defender2.x, y: sc.start.y + sc.defender2.y } : null;
  const goals0 = st.score.home;
  out[sc.name] = runContractScenario(sc, {
    step(i: Record<string, boolean | undefined>, dt: number) {
      st.inputs.home = { ...idle(), ...i } as any; st.inputs.guest = idle() as any;
      tickGame(st, dt, DEFAULT_BEHAVIOR_CONFIG, NOREM);
      if (defPos) { def.x = defPos.x; def.y = defPos.y; }
      if (defPos2) { def2.x = defPos2.x; def2.y = defPos2.y; }
    },
    player: () => ({ x: me.x, y: me.y }),
    ball: () => ({ x: st.ball.x, y: st.ball.y, vx: st.ball.vx, vy: st.ball.vy }),
    defenders: () => [defPos && { x: def.x, y: def.y }, defPos2 && { x: def2.x, y: def2.y }].filter(Boolean) as { x: number; y: number }[],
    scored: () => st.score.home > goals0,
    controlRadius: C.BALL_CONTROL_RADIUS,
    contactDist: C.PLAYER_RADIUS + C.BALL_RADIUS,
  }, DT);
}
console.log(JSON.stringify({ engine: 'project-hub-api', commit: commit, tickHz: 30, scenarios: out }, null, 2));
