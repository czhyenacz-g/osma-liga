import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import PlayerVisualTemplateSwitcher from './PlayerVisualTemplateSwitcher';
import { getPlayerVisualTemplate } from '@/game/presentation/playerVisualSettings';
import { DEFAULT_PLAYER_VISUAL_TEMPLATE } from '@/game/presentation/playerVisualTemplate';

afterEach(cleanup);

describe('PlayerVisualTemplateSwitcher', () => {
  it('keeps every existing style and makes Fotbal v5 the default', () => {
    const { getByRole, getAllByRole } = render(<PlayerVisualTemplateSwitcher />);
    const radios = getAllByRole('radio').map((r) => r.textContent);
    expect(radios).toEqual(['Pixel', 'Kruhy', 'Fotbal. v1', 'Fotbal. v2', 'Fotbal. v3', 'Fotbal. v4', 'Fotbal. v5', 'Původní']);
    expect([...(getByRole('combobox') as HTMLSelectElement).options].map((o) => o.text)).toContain('SVG fotbalisté v5');
    expect(DEFAULT_PLAYER_VISUAL_TEMPLATE).toBe('svg-footballers-v5');
    expect(getByRole('radio', { name: 'Fotbal. v5' }).getAttribute('aria-checked')).toBe('true');
  });

  it('selecting v5 switches the stored preference immediately', () => {
    const { getByRole } = render(<PlayerVisualTemplateSwitcher />);
    fireEvent.click(getByRole('radio', { name: 'Fotbal. v5' }));
    expect(getPlayerVisualTemplate()).toBe('svg-footballers-v5');
    expect(window.localStorage.getItem('osmaliga.playerVisualTemplate')).toBe('svg-footballers-v5');
    fireEvent.change(getByRole('combobox'), { target: { value: 'svg-footballers-v4' } });
    expect(getPlayerVisualTemplate()).toBe('svg-footballers-v4');
  });
});
