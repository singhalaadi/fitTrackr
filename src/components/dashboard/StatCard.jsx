import Card from "../common/Card";

export default function StatCard({ title, value, unit, icon: Icon, color, trend }) {
  return (
    <Card className="no-line-card hover:translate-y-[-4px] group bg-surface-container-low/40">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-surface-container-high text-on-surface-variant group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" style={{ color: trend?.startsWith('+') ? color : undefined }} />
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded bg-black/40 ${trend?.startsWith('+') ? 'text-primary' : (trend === 'PR' ? 'text-secondary' : 'text-error')}`}>
          {trend}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic tracking-tighter">{value}</span>
          <span className="text-[10px] font-label text-surface-variant uppercase italic font-bold">{unit}</span>
        </div>
      </div>
    </Card>
  );
}
