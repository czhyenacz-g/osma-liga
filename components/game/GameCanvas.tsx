'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { CANVAS_W, CANVAS_H } from '@/game/constants';
import { createInitialState } from '@/game/createInitialState';
import { createInputState, attachInputListeners } from '@/game/input';
import { updateGame } from '@/game/updateGame';
import { renderGame } from '@/game/renderGame';
import { resumeAudio } from '@/game/audio';
import { playKickoffWhistle, playGoalSound, playRestartSound } from '@/lib/audio/whistleEngine';
import type { GameState, InputState, TouchInput } from '@/game/types';

interface Props {
  onMatchEnd?: (score: { home: number; away: number }) => void;
  onRestart?: () => void;
  touchInputRef?: MutableRefObject<TouchInput>;
}

export default function GameCanvas({ onMatchEnd, onRestart, touchInputRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mutable refs — not React state to avoid stale closures in RAF
    let gameState: GameState = createInitialState();
    const input: InputState = createInputState();

    const removeInput = attachInputListeners(input);

    // Unlock AudioContext on first keypress (required by browser autoplay policy)
    const onFirstKey = () => { resumeAudio(); };
    window.addEventListener('keydown', onFirstKey, { once: true });

    // Esc navigates to šatna when match is ended
    const onEsc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && gameState.phase === 'ended') {
        window.location.href = '/satna';
      }
    };
    window.addEventListener('keydown', onEsc);

    let rafId: number;
    let lastTime = performance.now();
    let prevPhase = gameState.phase;

    const loop = (now: number) => {
      // Cap dt to 50ms to prevent large jumps after tab switch
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const touch = touchInputRef?.current;
      const merged: InputState = touch
        ? {
            up: input.up || touch.up,
            down: input.down || touch.down,
            left: input.left || touch.left,
            right: input.right || touch.right,
            kick: input.kick || touch.kick,
            restart: input.restart,
          }
        : input;

      const wasRestart = merged.restart;
      gameState = updateGame(gameState, merged, dt);

      // Kickoff on manual restart; goal sound on goal entry; pum on restart
      if (wasRestart) {
        playKickoffWhistle();
      } else if (prevPhase !== 'goal' && gameState.phase === 'goal') {
        playGoalSound();
      } else if (prevPhase === 'goal' && gameState.phase === 'playing') {
        playRestartSound();
      }
      // Notify parent when match ends for the first time
      if (prevPhase !== 'ended' && gameState.phase === 'ended') {
        onMatchEnd?.({ home: gameState.score.home, away: gameState.score.away });
      }

      // Notify parent on restart so save UI can reset
      if (wasRestart) {
        onRestart?.();
      }

      prevPhase = gameState.phase;

      renderGame(ctx, gameState);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      removeInput();
      window.removeEventListener('keydown', onFirstKey);
      window.removeEventListener('keydown', onEsc);
    };
  }, [onMatchEnd, onRestart, touchInputRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        maxWidth: CANVAS_W,
        borderRadius: '6px',
        outline: '1px solid rgba(255,255,255,0.1)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    />
  );
}
