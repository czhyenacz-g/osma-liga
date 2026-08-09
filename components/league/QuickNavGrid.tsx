import Link from 'next/link';

const ITEMS = [
  { title: 'Tabulka', text: 'Podívej se, jak si vedou všechny týmy.', href: '/demo#tabulka' },
  { title: 'Kluby', text: 'Prohlédni si kluby Osmé ligy.', href: '/kluby' },
  { title: 'Turnaje', text: 'Zapoj se do turnajů a speciálních akcí.', href: '/turnaj' },
  { title: 'Aktuality', text: 'Novinky a dění z Osmé ligy.', href: '/demo#aktuality' },
];

export default function QuickNavGrid() {
  return (
    <section className="px-4 py-10" style={{ background: '#041f14' }}>
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {ITEMS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col gap-1.5 rounded-xl p-4 transition hover:border-[#d6a94a]/60 sm:p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(214,169,74,0.18)',
            }}
          >
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#d6a94a' }}>
              {item.title}
            </span>
            <span className="text-xs leading-snug" style={{ color: 'rgba(209,250,229,0.65)' }}>
              {item.text}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
