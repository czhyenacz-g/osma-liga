'use client';

import TeamGameSelector from '@/components/league/TeamGameSelector';

// Hero sekce pro /demo — vícéřadý výběr klubů blíž vizuální hustotě /demo-1,
// ale se zachovaným kompaktním spacingem a scroll cue dolů na další obsah.
// Původní varianta zůstává v GameHero.tsx (používá /demo-1).
export default function GameHeroCompact() {
  function scrollToNextSection() {
    const target = document.getElementById('after-hero');
    if (!target) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section className="relative px-4 pb-8 pt-5 text-center sm:pt-6">
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,17,10,0.5) 0%, rgba(3,17,10,0.78) 100%)',
        }}
      />
      <div className="relative mx-auto max-w-[1000px]">
        <h1
          className="font-extrabold uppercase"
          style={{
            fontSize: 'clamp(26px, 5vw, 46px)',
            lineHeight: 1.06,
            letterSpacing: '-0.01em',
            color: '#eef3ef',
            textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          Vyber si tým.{' '}
          <span style={{ color: '#e3b94f' }}>Vlez na hřiště.</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/75 sm:text-base">
          Vyber si klub a hraj za něj proti počítači nebo ostatním hráčům.
        </p>

        <div className="mt-5">
          <TeamGameSelector variant="expanded" />
        </div>

        <button
          type="button"
          onClick={scrollToNextSection}
          aria-label="Přejít na další část stránky"
          className="relative mx-auto mt-6 flex items-center justify-center rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6a94a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#052e1a]"
          style={{
            width: 44,
            height: 44,
            background: 'rgba(4,31,20,0.55)',
            border: '1px solid rgba(214,169,74,0.35)',
          }}
        >
          <svg
            className="motion-safe:animate-bounce"
            width="20"
            height="16"
            viewBox="0 0 20 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 1.5 10 8l8-6.5" stroke="#d6a94a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <path d="M2 7.5 10 14l8-6.5" stroke="#d6a94a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
