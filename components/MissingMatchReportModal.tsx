'use client';

import { useEffect, useState } from 'react';

const missingMatchReportMessages = [
  {
    title: 'Zápis o utkání se bohužel ztratil.',
    text: 'Podle výboru ho měl zapisovatel v kapse tepláků. Tepláky se našly, zápis ne.',
  },
  {
    title: 'Zápis se nedochoval.',
    text: 'Rozhodčí tvrdí, že všechno viděl. Bohužel si nic nezapsal.',
  },
  {
    title: 'Detail zápasu zatím není k dispozici.',
    text: 'Zápis leží někde mezi šatnou, výčepem a šestnáctkou.',
  },
  {
    title: 'Zápis o utkání chybí.',
    text: 'Domácí tvrdí, že byl. Hosté tvrdí, že nebyl. Výbor zasedá.',
  },
  {
    title: 'Více o zápase zatím nemáme.',
    text: 'Pamětníci se neshodnou ani na výsledku, natož na průběhu.',
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MissingMatchReportModal({ isOpen, onClose }: Props) {
  const [message, setMessage] = useState(missingMatchReportMessages[0]);

  useEffect(() => {
    if (isOpen) {
      setMessage(
        missingMatchReportMessages[Math.floor(Math.random() * missingMatchReportMessages.length)]
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
