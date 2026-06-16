import type { InputState } from './types';

export function createInputState(): InputState {
  return { up: false, down: false, left: false, right: false, kick: false, restart: false };
}

export function attachInputListeners(input: InputState): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':    case 'KeyW': input.up    = true; break;
      case 'ArrowDown':  case 'KeyS': input.down  = true; break;
      case 'ArrowLeft':  case 'KeyA': input.left  = true; break;
      case 'ArrowRight': case 'KeyD': input.right = true; break;
      case 'Space': input.kick = true; e.preventDefault(); break;
      case 'KeyR':  input.restart = true; break;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowUp':    case 'KeyW': input.up    = false; break;
      case 'ArrowDown':  case 'KeyS': input.down  = false; break;
      case 'ArrowLeft':  case 'KeyA': input.left  = false; break;
      case 'ArrowRight': case 'KeyD': input.right = false; break;
      case 'Space': input.kick = false; break;
      case 'KeyR':  input.restart = false; break;
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}
