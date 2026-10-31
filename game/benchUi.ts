import type { BenchRole, PlayerMatchStatus } from './types';

// UI view of a team's one bench player, shared by the local bot game and the
// online modes (training challenge, multiplayer). Purely derived from the
// engines' existing data model — matchStatus + benchUsed (+ the deployment's
// remaining time) — never a separate state machine:
//   ready  = matchStatus 'bench' && !benchUsed
//   active = matchStatus 'temporarily_deployed'
//   used   = matchStatus 'bench' && benchUsed (deployment expired)
export type BenchPhase = 'ready' | 'active' | 'used';

export interface BenchUiState {
  playerId: string;
  label: string;
  phase: BenchPhase;
  // Only while active; null otherwise (or when the engine didn't send it).
  remainingMs: number | null;
  // Role it was called up with — null while ready, or from an older backend.
  role: BenchRole | null;
}

// Minimal per-player shape both engines can provide (local GameState via
// GameCanvas, online snapshot via useOnlineGame).
export interface BenchCandidate {
  id: string;
  label: string;
  matchStatus?: PlayerMatchStatus;
  benchUsed?: boolean;
  remainingMs?: number | null;
  benchRole?: BenchRole | null;
}

// Picks the team's bench player (DEFAULT_BENCH_SIZE is 1) — a deployed one
// first, then a ready one, then a used one. Returns null when the team has
// no bench player at all (e.g. a snapshot from a backend without the bench).
export function resolveBenchUiState(candidates: BenchCandidate[]): BenchUiState | null {
  const bench = candidates.filter((p) => p.matchStatus === 'bench' || p.matchStatus === 'temporarily_deployed');
  const active = bench.find((p) => p.matchStatus === 'temporarily_deployed');
  if (active) {
    return {
      playerId: active.id, label: active.label, phase: 'active',
      remainingMs: active.remainingMs ?? null, role: active.benchRole ?? null,
    };
  }
  const ready = bench.find((p) => !p.benchUsed);
  if (ready) return { playerId: ready.id, label: ready.label, phase: 'ready', remainingMs: null, role: null };
  const used = bench[0];
  if (used) return { playerId: used.id, label: used.label, phase: 'used', remainingMs: null, role: used.benchRole ?? null };
  return null;
}
