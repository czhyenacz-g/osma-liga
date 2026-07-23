export type PlayerTeam = 'home' | 'away';

// The shared presentation contract — every game mode (single-player bot
// engine, online multiplayer) adapts its own data into this shape (see
// resolvePlayerRenderState.ts) so a single PlayerRenderer/template set can
// draw all of them. Only data needed to render is here; this is NOT a new
// parallel game state — everything is derived fresh each frame from the
// existing GameState / OnlineSnapshot and discarded.
export interface PlayerRenderState {
  id: string;
  team: PlayerTeam;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  // True when this player is on the locally-controlled side — always true
  // for the home team in single-player (you always control home), and true
  // for whichever side (home/guest) the local socket connection actually
  // plays as in online multiplayer. Distinct from isActive (which reflects
  // each team's own currently-controlled player, both teams, e.g. for
  // legacy's per-team body shading) — this exists so the active-player
  // ring/arrow can be restricted to "my own active player" exactly like
  // today's online canvas does, without guessing from isActive alone.
  isMine: boolean;
  isMoving: boolean;
  // 1 = facing right (the templates' base drawing direction), -1 = facing
  // left (mirrored). Derived from vx with a dead-zone — see
  // resolvePlayerRenderState.ts.
  facingDirection: 1 | -1;
  isCharging: boolean;
  // 0..1 — charge progress toward a full-power shot. Purely visual feedback;
  // never affects actual kick force.
  chargeProgress: number;
  isKicking: boolean;
  hasBall: boolean;
  isRemoved: boolean;
}

// Template components are mounted ONCE per player and never re-rendered for
// per-frame data (position, facing, moving/charging/kicking) — those are
// written imperatively by PlayerVisualContainer onto wrapping <g> elements
// (transform + boolean classNames), and CSS (playerVisualAnimations.css)
// reacts to the classNames on the ancestor. A template therefore only ever
// needs the things that are static for a player's whole time on the pitch:
// which team they're on (colour), their label, and the reference hitbox
// size. hitboxRadiusPx is == game/constants.ts PLAYER_RADIUS on the bot
// engine / the mirrored server-side PLAYER_RADIUS for online (18px today) —
// used only to decide how big to draw relative to the real hitbox; nothing
// here ever changes the physical collision radius itself.
export interface PlayerVisualComponentProps {
  team: PlayerTeam;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  hitboxRadiusPx: number;
}
