/**
 * Reusable ad placeholder. Not bound to any ad network/provider —
 * later swap the placeholder content for a real affiliate/partner/network embed.
 */
export default function AdSlot({
  id,
  orientation = 'horizontal',
  className = '',
}: {
  id: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}) {
  return (
    <div
      data-ad-slot={id}
      className={`mx-auto flex w-full items-center justify-center rounded-lg ${
        orientation === 'vertical' ? 'min-h-[250px] sm:min-h-[600px]' : 'min-h-[90px] sm:min-h-[110px]'
      } ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(214,169,74,0.28)',
      }}
    >
      <span
        className="px-4 text-center text-[10px] font-bold uppercase tracking-[0.25em]"
        style={{ color: 'rgba(209,250,229,0.32)' }}
      >
        Reklamní prostor
      </span>
    </div>
  );
}
