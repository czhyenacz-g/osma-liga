'use client';

import { useEffect, useRef } from 'react';
import { CANVAS_W, CANVAS_H } from '@/game/constants';
import { createInitialState } from '@/game/createInitialState';
import { createInputState, attachInputListeners } from '@/game/input';
import { updateGame } from '@/game/updateGame';
import { renderGame } from '@/game/renderGame';
import { playWhistle, resumeAudio } from '@/game/audio';
import type { GameState, InputState } from '@/game/types';

export default function GameCanvas() {
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

    // Attempt start whistle — succeeds only if audio is already unlocked
    playWhistle();

    let rafId: number;
    let lastTime = performance.now();
    let prevPhase = gameState.phase;

    const loop = (now: number) => {
      // Cap dt to 50ms to prevent large jumps after tab switch
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const wasRestart = input.restart;
      gameState = updateGame(gameState, input, dt);

      // Whistle on restart (R key) or when goal phase resolves to playing
      if (wasRestart || (prevPhase === 'goal' && gameState.phase === 'playing')) {
        playWhistle();
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
    };
  }, []);

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
      }}
    />
  );
}
