import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MobileTouchControls from './MobileTouchControls';
import type { TouchInput } from '@/game/types';

// Kick button: hold = charge, vertical drag = aim (aimed charged shot,
// game/shotAim.ts), release / cancel / lost capture = fire and clear.

const fresh = (): { current: TouchInput } => ({
  current: { up: false, down: false, left: false, right: false, kick: false, switchPlayer: false, aimUp: false, aimDown: false },
});

beforeAll(() => {
  // jsdom has no pointer capture.
  HTMLElement.prototype.setPointerCapture ??= () => {};
});
afterEach(cleanup);

describe('MobileTouchControls — kick button aiming', () => {
  it('hold charges, dragging up/down aims, releasing fires and clears', () => {
    const ref = fresh();
    render(<MobileTouchControls touchRef={ref} />);
    const kick = screen.getByLabelText('Kop');
    fireEvent.pointerDown(kick, { pointerId: 7, clientY: 500 });
    expect(ref.current.kick).toBe(true);
    fireEvent.pointerMove(kick, { pointerId: 7, clientY: 505 }); // inside dead zone
    expect([ref.current.aimUp, ref.current.aimDown]).toEqual([false, false]);
    fireEvent.pointerMove(kick, { pointerId: 7, clientY: 470 });
    expect([ref.current.aimUp, ref.current.aimDown]).toEqual([true, false]);
    fireEvent.pointerMove(kick, { pointerId: 7, clientY: 540 });
    expect([ref.current.aimUp, ref.current.aimDown]).toEqual([false, true]);
    // Leaving the button while dragging does not fire the shot.
    fireEvent.pointerLeave(kick, { pointerId: 7 });
    expect(ref.current.kick).toBe(true);
    fireEvent.pointerUp(kick, { pointerId: 7, clientY: 540 });
    expect(ref.current).toMatchObject({ kick: false, aimUp: false, aimDown: false });
  });

  it('a d-pad finger does not aim; cancel and lost capture never leave a stuck charge', () => {
    const ref = fresh();
    render(<MobileTouchControls touchRef={ref} />);
    const kick = screen.getByLabelText('Kop');
    fireEvent.pointerDown(kick, { pointerId: 1, clientY: 500 });
    fireEvent.pointerMove(kick, { pointerId: 2, clientY: 300 }); // another finger
    expect(ref.current.aimUp).toBe(false);
    fireEvent.pointerCancel(kick, { pointerId: 1 });
    expect(ref.current.kick).toBe(false);
    fireEvent.pointerDown(kick, { pointerId: 3, clientY: 500 });
    fireEvent.pointerMove(kick, { pointerId: 3, clientY: 450 });
    fireEvent.lostPointerCapture(kick, { pointerId: 3 });
    expect(ref.current).toMatchObject({ kick: false, aimUp: false, aimDown: false });
  });
});
