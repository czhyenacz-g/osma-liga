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
export const KICK_FORCE = 540;
export const KICK_COOLDOWN = 0.25;
export const BUMP_FORCE = 110;
export const RETURN_SPEED = 115;

// Ball
export const BALL_RADIUS = 10;
export const BALL_MAX_SPEED = 800;

// Bot
export const BOT_SPEED = 165;
export const BOT_KICK_FORCE = 460;
export const BOT_KICK_RANGE = PLAYER_RADIUS + 22;
export const BOT_KICK_COOLDOWN = 0.85;

// Ball control (soft trap for active home player)
export const BALL_CONTROL_RADIUS = 44;
export const BALL_CONTROL_DAMPING = 0.90;
export const BALL_CONTROL_FORCE = 110;
export const BALL_CONTROL_OFFSET = 26;

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
