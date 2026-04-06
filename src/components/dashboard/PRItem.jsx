export default function PRItem({ exercise, weight, unit, isNew }) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-primary/30 transition-colors group relative overflow-hidden">
      {isNew && <div className="absolute top-0 right-0 bg-primary text-[6px] font-black italic uppercase px-2 py-0.5 rounded-bl-lg text-on-primary">NEW MONTH BEST</div>}
      <div className="space-y-1 pr-4 min-w-0">
        <p className="text-sm font-label uppercase tracking-wider text-on-surface-variant group-hover:text-primary transition-colors font-black italic truncate">{exercise}</p>
        <p className="text-[9px] font-label text-surface-variant uppercase font-bold">ALL-TIME BEST</p>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-2xl font-black italic">{weight}</span>
        <span className="text-[10px] font-label text-surface-variant uppercase italic font-bold">{unit}</span>
      </div>
    </div>
  );
}
