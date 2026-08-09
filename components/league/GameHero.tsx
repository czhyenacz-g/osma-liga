import TeamGameSelector from '@/components/league/TeamGameSelector';

export default function GameHero() {
  return (
    <section className="relative px-4 pb-10 pt-8 text-center sm:pt-12">
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
            fontSize: 'clamp(30px, 6vw, 58px)',
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
            color: '#eef3ef',
            textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.5)',
          }}
        >
          Vyber si tým.{' '}
          <span style={{ color: '#e3b94f' }}>Vlez na hřiště.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
          Vyber si klub a hraj za něj proti počítači nebo ostatním hráčům.
        </p>

        <div className="mt-9">
          <TeamGameSelector />
        </div>
      </div>
    </section>
  );
}
