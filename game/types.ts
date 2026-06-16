export type Team = 'home' | 'away';
export type GamePhase = 'playing' | 'goal' | 'ended';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  team: Team;
  pos: Vec2;
  vel: Vec2;
  basePos: Vec2;
  label: string;
  kickCooldown: number;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
}

export interface GameState {
  players: Player[];
  ball: Ball;
  score: { home: number; away: number };
  timeLeft: number;
  phase: GamePhase;
  goalMessage: string;
  goalTimer: number;
  activePlayerId: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  kick: boolean;
  restart: boolean;
}
