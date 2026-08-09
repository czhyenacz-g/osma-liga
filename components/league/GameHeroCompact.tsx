import TeamGameSelector from '@/components/league/TeamGameSelector';

// Kompaktnější iterace hero sekce pro /demo — cílem je vejít celý herní flow
// (klub → režim → CTA) do prvního viewportu na běžném desktopu/notebooku.
// Původní verze zůstává v GameHero.tsx (používá /demo-1).
export default function GameHeroCompact() {
  return (
    <section className="relative px-4 pb-6 pt-5 text-center sm:pt-6">
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
          <TeamGameSelector variant="compact" />
        </div>
      </div>
    </section>
  );
}
