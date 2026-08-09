import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TeamGameSelector from './TeamGameSelector';
import { CLUBS } from '@/data/clubs';

describe('TeamGameSelector', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('default variant renders without scroll arrows', () => {
    render(<TeamGameSelector />);
    expect(screen.queryByLabelText('Posunout kluby vlevo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Posunout kluby vpravo')).not.toBeInTheDocument();
  });

  it('compact variant renders scroll arrows', () => {
    render(<TeamGameSelector variant="compact" />);
    expect(screen.getByLabelText('Posunout kluby vlevo')).toBeInTheDocument();
    expect(screen.getByLabelText('Posunout kluby vpravo')).toBeInTheDocument();
  });

  it('selecting a club updates the CTA question and persists to localStorage', () => {
    render(<TeamGameSelector variant="compact" />);
    const secondClub = CLUBS[1];

    fireEvent.click(screen.getByRole('button', { name: new RegExp(secondClub.name) }));

    expect(screen.getByRole('heading')).toHaveTextContent(
      `Jak chceš hrát za ${secondClub.name}?`,
    );
    expect(window.localStorage.getItem('osmaliga:selectedClub')).toBe(secondClub.slug);
  });

  it('points the game mode CTAs at the selected club via ?club=', () => {
    render(<TeamGameSelector variant="compact" />);
    const thirdClub = CLUBS[2];

    fireEvent.click(screen.getByRole('button', { name: new RegExp(thirdClub.name) }));

    expect(screen.getByRole('link', { name: /Proti počítači/ })).toHaveAttribute(
      'href',
      `/hra/bot?club=${thirdClub.slug}`,
    );
    expect(screen.getByRole('link', { name: /Online proti hráči/ })).toHaveAttribute(
      'href',
      `/hra/multiplayer?club=${thirdClub.slug}`,
    );
  });

  it('expanded variant renders without scroll arrows (multi-row wrap layout instead)', () => {
    render(<TeamGameSelector variant="expanded" />);
    expect(screen.queryByLabelText('Posunout kluby vlevo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Posunout kluby vpravo')).not.toBeInTheDocument();
  });

  it('expanded variant renders a "Další kluby" card linking to /kluby', () => {
    render(<TeamGameSelector variant="expanded" />);
    expect(screen.getByRole('link', { name: /Další kluby/ })).toHaveAttribute('href', '/kluby');
  });

  it('default and compact variants do not render the "Další kluby" card', () => {
    render(<TeamGameSelector />);
    expect(screen.queryByRole('link', { name: /Další kluby/ })).not.toBeInTheDocument();
  });

  it('club crests show a hover tooltip with name and note', () => {
    render(<TeamGameSelector />);
    const firstClub = CLUBS[0];

    expect(screen.getByRole('button', { name: new RegExp(firstClub.name) })).toHaveAttribute(
      'title',
      `${firstClub.name} — ${firstClub.note}`,
    );
  });
});
