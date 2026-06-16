interface Props {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-1.5 text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
