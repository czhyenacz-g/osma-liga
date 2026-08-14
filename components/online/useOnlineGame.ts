'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { playFullTimeWhistle, playKickoffWhistle } from '@/lib/audio/whistleEngine';

export interface OnlinePlayer {
  id: string;
  team: 'home' | 'away';
  x: number;
  y: number;
  active: boolean;
  label: string;
  // Temporarily removed (random substitution, see project-hub-api's
  // gameEngine/temporaryRemoval.ts) — not eligible as active or support.
  removed?: boolean;
  // Mirrors project-hub-api's gameEngine OnlinePlayer.role === 'goalkeeper' —
  // see onlineGames.ts buildSnapshot(). Drives goalkeeper visual distinction
  // (resolvePlayerRenderState.ts) on the client.
  isGoalkeeper?: boolean;
  // Mirrors project-hub-api's OnlinePlayer.stats.size (playerStats.ts) — the
  // server's per-player visual size in px. Feeds resolvePlayerRenderState.ts's
  // sizeScale; never a physical/collision value on the client.
  size?: number;
}

export interface OnlineSnapshot {
  tick: number;
  status: string;
  timeLeftSeconds: number;
  score: { home: number; away: number };
  ball: { x: number; y: number };
  players: OnlinePlayer[];
  goalMessage: string;
  isOwnGoal?: boolean;
  lastScorer?: 'home' | 'away' | null;
  homeClubName?: string | null;
  awayClubName?: string | null;
}

export function useOnlineGame(gameCode: string, playerToken: string) {
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<OnlineSnapshot | null>(null);
  const [role, setRole] = useState<'home' | 'guest' | null>(null);
  const [gameStatus, setGameStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_PROJECT_HUB_WS_URL ?? 'http://localhost:3001';
    const socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Debug-only WS RTT probe — enabled via ?wsdebug=1, see
    // docs/network/realtime-architecture-audit.md. Measures raw round-trip
    // network time, independent of game tick/snapshot cadence.
    const debugEnabled =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('wsdebug') === '1';
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    if (debugEnabled) {
      socket.on('debug_pong', (clientTimestamp: number) => {
        setRttMs(Date.now() - clientTimestamp);
      });
      pingInterval = setInterval(() => {
        socket.emit('debug_ping', Date.now());
      }, 2000);
    }

    socket.on('connect', () => {
      socket.emit('join_game', { gameCode, playerToken });
    });

    socket.on('joined_game', ({ role: r }: { role: 'home' | 'guest'; status: string }) => {
      setRole(r);
      setGameStatus('waiting');
    });

    socket.on('game_started', () => {
      setGameStatus('playing');
      playKickoffWhistle();
    });

    socket.on('state', (data: OnlineSnapshot) => {
      setSnapshot(data);
    });

    socket.on('game_finished', () => {
      setGameStatus('finished');
      playFullTimeWhistle();
    });

    socket.on('error', ({ message }: { message: string }) => {
      setErrorMsg(message);
      setGameStatus('error');
    });

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      socket.disconnect();
    };
  }, [gameCode, playerToken]);

  const sendInput = useCallback((input: Record<string, boolean>) => {
    socketRef.current?.emit('input', input);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  return { snapshot, role, gameStatus, errorMsg, sendInput, startGame, rttMs };
}
