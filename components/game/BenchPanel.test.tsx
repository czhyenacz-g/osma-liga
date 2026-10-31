import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import BenchPanel, { BENCH_REQUEST_PENDING_MS } from './BenchPanel';
import type { BenchUiState } from '@/game/benchUi';

const READY: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'ready', remainingMs: null, role: null };
const ACTIVE: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'active', remainingMs: 22_100, role: 'defender' };
const USED: BenchUiState = { playerId: 'h-bench-0', label: 'B1', phase: 'used', remainingMs: null, role: 'attacker' };

function press(code: string, init: KeyboardEventInit = {}, target: Window | Element = window) {
  fireEvent.keyDown(target, { code, ...init });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('BenchPanel', () => {
  it('READY: Lavička panel with Útočník (1) and Obránce (2) call-up buttons', () => {
    render(<BenchPanel bench={READY} onActivate={() => {}} />);
    expect(screen.getByRole('group', { name: 'Lavička' })).toBeInTheDocument();
    expect(screen.getByText('Žolík z lavičky')).toBeInTheDocument();
    expect(screen.getByText('Povolat na 30 s')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /jako útočníka.*klávesa 1/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /jako obránce.*klávesa 2/ })).toBeEnabled();
  });

  it('ACTIVE: shows the role and the remaining time, no buttons', () => {
    render(<BenchPanel bench={ACTIVE} onActivate={() => {}} />);
    expect(screen.getByText('Žolík (obránce) je na hřišti')).toBeInTheDocument();
    expect(screen.getByText('Zbývá 23 s')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ACTIVE from a backend without roles: generic title', () => {
    render(<BenchPanel bench={{ ...ACTIVE, role: null }} onActivate={() => {}} />);
    expect(screen.getByText('Žolík je na hřišti')).toBeInTheDocument();
  });

  it('USED: shows it is spent, no buttons, keys do nothing', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={USED} onActivate={onActivate} />);
    expect(screen.getByText('Žolík už má odpracováno')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    press('Digit1');
    press('Digit2');
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('renders nothing without a bench (old backend)', () => {
    const { container } = render(<BenchPanel bench={null} onActivate={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('each button requests the deployment with its role', () => {
    const onActivate = vi.fn();
    const { unmount } = render(<BenchPanel bench={READY} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole('button', { name: /jako obránce/ }));
    expect(onActivate).toHaveBeenLastCalledWith('h-bench-0', 'defender');
    unmount();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole('button', { name: /jako útočníka/ }));
    expect(onActivate).toHaveBeenLastCalledWith('h-bench-0', 'attacker');
  });

  it('double click / click + key sends a single request while it is pending', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    fireEvent.click(screen.getByRole('button', { name: /jako útočníka/ }));
    fireEvent.click(screen.getByRole('button', { name: /jako útočníka/ }));
    fireEvent.click(screen.getByRole('button', { name: /jako obránce/ }));
    press('Digit2');
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Volám žolíka…')).toBeInTheDocument();
  });

  it('a request that is not confirmed (rejected/lost) can be retried after the pending window', () => {
    vi.useFakeTimers();
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    press('Digit1');
    act(() => { vi.advanceTimersByTime(BENCH_REQUEST_PENDING_MS + 10); });
    press('Digit2');
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenLastCalledWith('h-bench-0', 'defender');
  });

  it('keys 1/2 (and numpad) pick the role; held-key auto-repeat does not activate', () => {
    const onActivate = vi.fn();
    const { rerender } = render(<BenchPanel bench={READY} onActivate={onActivate} />);
    press('Digit1', { repeat: true });
    expect(onActivate).not.toHaveBeenCalled();
    press('Numpad2');
    expect(onActivate).toHaveBeenCalledWith('h-bench-0', 'defender');
    rerender(<BenchPanel bench={ACTIVE} onActivate={onActivate} />);
    press('Digit1');
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('keys are ignored while typing into a form field or with modifiers', () => {
    const onActivate = vi.fn();
    render(
      <>
        <input aria-label="jméno" />
        <BenchPanel bench={READY} onActivate={onActivate} />
      </>,
    );
    press('Digit1', {}, screen.getByLabelText('jméno'));
    press('Digit2', { ctrlKey: true });
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('other game keys never trigger it', () => {
    const onActivate = vi.fn();
    render(<BenchPanel bench={READY} onActivate={onActivate} />);
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'Space', 'KeyQ', 'KeyR', 'Digit3']) press(code);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('floating (mobile) variant: fixed above PŘEP./KOP on the right, 44px+ touch targets', () => {
    render(<BenchPanel bench={READY} onActivate={() => {}} variant="floating" />);
    const group = screen.getByRole('group', { name: 'Lavička' });
    expect(group.style.position).toBe('fixed');
    expect(group.style.right).toBe('12px');
    expect(group.style.bottom).toBe('156px');
    for (const b of screen.getAllByRole('button')) expect(b.style.minHeight).toBe('44px');
  });
});
