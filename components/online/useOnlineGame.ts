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
}

export interface OnlineSnapshot {
  tick: number;
  status: string;
  timeLeftSeconds: number;
  score: { home: number; away: number };
  ball: { x: number; y: number };
  players: OnlinePlayer[];
  goalMessage: string;
}

export function useOnlineGame(gameCode: string, playerToken: string) {
  const socketRef = useRef<Socket | null>(null);
  const [snapshot, setSnapshot] = useState<OnlineSnapshot | null>(null);
  const [role, setRole] = useState<'home' | 'guest' | null>(null);
  const [gameStatus, setGameStatus] = useState<'connecting' | 'waiting' | 'playing' | 'finished' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_PROJECT_HUB_WS_URL ?? 'http://localhost:3001';
    const socket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

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
      socket.disconnect();
    };
  }, [gameCode, playerToken]);

  const sendInput = useCallback((input: Record<string, boolean>) => {
    socketRef.current?.emit('input', input);
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  return { snapshot, role, gameStatus, errorMsg, sendInput, startGame };
}
