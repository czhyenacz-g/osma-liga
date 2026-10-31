import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import BenchPanel, { BENCH_REQUEST_PENDING_MS } from './BenchPanel';
import type { BenchUiState } from '@/game/benchUi';

const READY: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'ready', remainingMs: null };
const ACTIVE: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'active', remainingMs: 22_100 };
const USED: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'used', remainingMs: null };

function pressOne(init: KeyboardEventInit = {}, target: Window | Element = window) {
  fireEvent.keyDown(target, { code: 'Digit1', key: '1', ...init });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('BenchPanel', () => {
  it('READY: shows the Lavička panel with the call-up button', () => {
    render(<BenchPanel bench={READY} onActivate={() => {}} />);
    expect(screen.getByRole('group', { name: 'Lavička' })).toBeInTheDocument();
    expect(screen.getByText('Žolík z lavičky')).toBeInTheDocument();
    expect(screen.getByText('Povolat na 30 s')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Povolat žolíka/ })).toBeEnabled();
  });

  it('ACTIVE: shows the remaining time, no button', () => {
    render(<BenchPanel bench={ACTIVE} onActivate={() => {}} />);
    expect(screen.getByText('Žolík je na hřišti')).toBeInTheDocument();
    expect(screen.getByText('Zbývá 23 s')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('USED: shows it is spent, no button, key 1 does nothing', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={USED} onActivate={onActivate} />);
    expect(screen.getByText('Žolík už má odpracováno')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    pressOne();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('renders nothing without a bench (old backend)', () => {
    const { container } = render(<BenchPanel bench={null} onActivate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('click requests the deployment of this team\'s bench player', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole('button', { name: /Povolat žolíka/ }));
    expect(onActivate).toHaveBeenCalledWith('h-bench-0');
  });

  it('double click / click + key sends a single request while it is pending', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    const btn = screen.getByRole('button', { name: /Povolat žolíka/ });
    fireEvent.click(btn);
    fireEvent.click(btn);
    pressOne();
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Volám žolíka…')).toBeInTheDocument();
  });

  it('a request that is not confirmed (rejected/lost) can be retried after the pending window', () => {
    vi.useFakeTimers();
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    pressOne();
    act(() => { vi.advanceTimersByTime(BENCH_REQUEST_PENDING_MS + 10); });
    pressOne();
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it('key 1 (and numpad 1) activates; held-key auto-repeat does not', () => {
    const onActivate = vi.fn();
    const { rerender } = render(<BenchPanel bench={READY} onActivate={onActivate} />);
    pressOne({ repeat: true });
    expect(onActivate).not.toHaveBeenCalled();
    pressOne({ code: 'Numpad1' });
    expect(onActivate).toHaveBeenCalledTimes(1);
    // Engine confirmed → active; further presses do nothing.
    rerender(<BenchPanel bench={ACTIVE} onActivate={onActivate} />);
    pressOne();
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('key 1 is ignored while typing into a form field or with modifiers', () => {
    const onActivate = vi.fn();
    render(
      <>
        <input aria-label="jméno" />
        <BenchPanel bench={READY} onActivate={onActivate} />
      </>,
    );
    pressOne({}, screen.getByLabelText('jméno'));
    pressOne({ ctrlKey: true });
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('other game keys never trigger it', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'Space', 'KeyQ', 'KeyR', 'Digit2']) {
      fireEvent.keyDown(window, { code });
    }
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('floating (mobile) variant is a fixed touch target placed above PŘEP./KOP, right side', () => {
    render(<BenchPanel bench={READY} onActivate={() => {}} variant="floating" />);
    const group = screen.getByRole('group', { name: 'Lavička' });
    expect(group.style.position).toBe('fixed');
    expect(group.style.right).toBe('12px');
    expect(group.style.bottom).toBe('156px');
    expect(screen.getByRole('button').style.minHeight).toBe('48px');
  });
});
