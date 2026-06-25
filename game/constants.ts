export const CANVAS_W = 960;
export const CANVAS_H = 540;

// Field bounds
export const FIELD_L = 60;
export const FIELD_R = 900;
export const FIELD_T = 50;
export const FIELD_B = 510;
export const FIELD_CX = (FIELD_L + FIELD_R) / 2;  // 480
export const FIELD_CY = (FIELD_T + FIELD_B) / 2;  // 280

// Goals (extend outside field edges)
export const GOAL_H = 130;
export const GOAL_DEPTH = 18;
export const GOAL_T = FIELD_CY - GOAL_H / 2;  // 215
export const GOAL_B = FIELD_CY + GOAL_H / 2;  // 345

// Players
export const PLAYER_RADIUS = 18;
export const PLAYER_SPEED = 210;
export const KICK_RANGE = PLAYER_RADIUS + 22;  // 40
export const KICK_FORCE = 486; // -10% from 540
export const KICK_COOLDOWN = 0.25;

// Charged kick — the shot fires on release of the kick button, not on press.
// A quick tap (near-zero hold) still fires at KICK_TAP_FORCE_MULTIPLIER;
// holding longer ramps the force up to KICK_MAX_CHARGE_FORCE_MULTIPLIER over
// KICK_MAX_CHARGE_MS, after which holding longer has no further effect.
export const KICK_TAP_FORCE_MULTIPLIER = 0.9;
export const KICK_MAX_CHARGE_FORCE_MULTIPLIER = 1.5;
export const KICK_MAX_CHARGE_MS = 1500;
export const BUMP_FORCE = 110;
export const RETURN_SPEED = 115;

// Ball
export const BALL_RADIUS = 10;
export const BALL_MAX_SPEED = 800;
// Energy retained when the ball bounces off a field wall/edge.
// Mirrors project-hub-api/src/gameEngine/constants.ts so /hra/bot and the
// online engine (multiplayer + training challenge) feel the same.
export const BALL_WALL_RESTITUTION = 0.75;

// Bot
export const BOT_SPEED = 165;
export const BOT_KICK_FORCE = 460;
export const BOT_KICK_RANGE = PLAYER_RADIUS + 22;
export const BOT_KICK_COOLDOWN = 0.85;

// Inactive teammate support movement speed
export const SUPPORT_PLAYER_SPEED = 120;

// Active player stability: new candidate must be this many px closer before switching.
// The margin fades out as the current active player gets farther from the
// ball (see computeSwitchMargin in updateGame.ts) — once the ball is kicked
// across the pitch, the bias toward the old active player drops away and
// the nearest player takes over almost immediately.
export const ACTIVE_PLAYER_SWITCH_MARGIN = 18;
export const ACTIVE_PLAYER_SWITCH_MARGIN_FADE_DISTANCE = 300;

// KISS guard against active-player flicker: the automatic (distance-based)
// pick may switch to a new player at most once per this many ms, regardless
// of how the margin/fade above evaluate. Manual switching (Q / PŘEP.) is
// unaffected — this only throttles the automatic algorithm.
export const AUTO_PLAYER_SWITCH_COOLDOWN_MS = 1000;

// Manual active-player switch (Q / PŘEP.) — how long a manual pick overrides
// automatic ball-distance selection before automatic picking resumes.
export const MANUAL_SWITCH_LOCK_DURATION = 2;

// Teammate separation — soft push to prevent overlapping
export const TEAMMATE_SEPARATION_RADIUS = 42;
export const TEAMMATE_SEPARATION_STRENGTH = 0.5;

// Ball control (soft trap for active home player)
export const BALL_CONTROL_RADIUS = 44;
export const BALL_CONTROL_DAMPING = 0.86;
export const BALL_CONTROL_FORCE = 130;        // without input direction
export const BALL_CONTROL_INPUT_FORCE = 210;  // with input direction — pulls ball in front faster
export const BALL_CONTROL_OFFSET = 34;

// Tighter retention on top of the base ball control above — kicks in only
// when the active player has basically stopped or sharply changed
// direction, no opponent is closing in, and the ball isn't moving fast
// (i.e. not a ball that was just struck). Makes stopping/cutting feel less
// like the ball "slides away" without turning dribbling into a hard lock.
export const BALL_RETENTION_RADIUS = 42;
export const BALL_RETENTION_NO_OPPONENT_RADIUS = 70;
export const BALL_RETENTION_MAX_BALL_SPEED = 180;
export const BALL_RETENTION_STRENGTH = 0.14;
export const BALL_STOP_DAMPING = 0.82;

// Kicking out of contact/a scrum (an opponent crowding the ball) nudges the
// ball forward along the kick direction before applying force, and gives
// the kick a clearance boost — so it reliably pops the ball clear instead
// of looking like it got swallowed by nearby bodies. A normal open kick
// (no opponent close to the ball) is completely unaffected.
export const KICK_CONTACT_RANGE = 50;
export const KICK_CONTACT_BALL_NUDGE = 12;
export const KICK_CONTACT_FORCE_MULTIPLIER = 1.3;

// On every kick, the ball is snapped to sit just outside the kicker's own
// collision radius (PLAYER_RADIUS + BALL_RADIUS) along the kick direction,
// before kick velocity is applied. Without this, a kick fired while the
// ball is still touching the kicker can get partially reversed later in
// the same tick by resolvePlayerBallCollisions(), which pushes the ball
// away from the kicker along whatever side it happens to overlap on —
// not necessarily the kick direction. KICK_SNAP_CLEARANCE is the small
// extra gap kept beyond that collision radius so the snap reliably clears it.
export const KICK_SNAP_CLEARANCE = 4;

// Lets a non-active, available teammate "receive" a slow/catchable ball
// contact and become the active player, instead of the ball just bouncing
// off them as a random physics obstacle. Own team only — opposing players
// never trigger this (resolvePlayerBallCollisions still bumps the ball off
// them as before).
export const TEAMMATE_BALL_RECEIVE_MAX_SPEED = 260;
export const TEAMMATE_BALL_RECEIVE_EXTRA_RADIUS = 4;
export const TEAMMATE_BALL_RECEIVE_LOCK_MS = 1200;

// Match
export const MATCH_DURATION = 90;
export const GOAL_PAUSE = 2.5;

// Corner zone — ball must be near BOTH horizontal and vertical edge
export const CORNER_ZONE_MARGIN = 72;
export const CORNER_WARNING_DELAY = 3;         // seconds before countdown shows
export const CORNER_CLEAR_DELAY = 8;           // seconds before systemic clearance kick
export const CORNER_CLEAR_SPEED = 360;
export const CORNER_CLEAR_REPOSITION = 96;     // px ball is moved toward center before velocity kick
export const CORNER_CLEAR_COOLDOWN = 1.5;      // seconds corner timer is suppressed after clear
