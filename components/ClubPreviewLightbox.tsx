'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  caption: string;
};

export default function ClubPreviewLightbox({ src, alt, caption }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group block w-full h-full overflow-hidden rounded-xl"
        style={{ border: '1px solid rgba(216,173,69,0.28)', background: 'rgba(6,63,36,0.55)' }}
        aria-label={caption}
      >
        <Image
          src={src}
          alt={alt}
          width={1055}
          height={1491}
          className="h-full w-full object-cover transition group-hover:opacity-90"
        />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1055}
              height={1491}
              className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: '#052e1a' }}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </>
  );
}
