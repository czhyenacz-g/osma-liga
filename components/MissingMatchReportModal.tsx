'use client';

import { useEffect, useState } from 'react';

const upcomingMatchInfoMessages = [
  {
    title: 'Sestava ještě není vyvěšená.',
    text: 'Trenér ji prý napsal na účtenku, ale hospoda už zavřela.',
  },
  {
    title: 'Zápasová nominace zatím chybí.',
    text: 'Půlka týmu ještě nepotvrdila, jestli může. Druhá půlka neví, kde má kopačky.',
  },
  {
    title: 'Rozpis zápasu už visí, sestava zatím ne.',
    text: 'V okresním fotbale se nejdřív ví, kdy se hraje. Kdo přijde, to se řeší cestou.',
  },
  {
    title: 'Sestava se teprve skládá.',
    text: 'Trenér má plán. Jen čeká, kdo mu zvedne telefon.',
  },
  {
    title: 'Místo zápasu už je jasné.',
    text: 'Teď se jen na výboru dolaďuje, kdo bude po závěrečném hvizdu spokojenější.',
  },
  {
    title: 'Rozpis je hotový, delegace se ladí.',
    text: 'Hledá se rozhodčí s pevným názorem a pružným výkladem pravidel.',
  },
  {
    title: 'Termín zápasu známe.',
    text: 'Výsledek samozřejmě ne. Jen někteří funkcionáři vypadají nezvykle klidně.',
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MissingMatchReportModal({ isOpen, onClose }: Props) {
  const [message, setMessage] = useState(upcomingMatchInfoMessages[0]);

  useEffect(() => {
    if (isOpen) {
      setMessage(
        upcomingMatchInfoMessages[Math.floor(Math.random() * upcomingMatchInfoMessages.length)]
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-gray-900">{message.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message.text}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: '#052e1a' }}
        >
          Zavřít
        </button>
      </div>
    </div>
  );
}
