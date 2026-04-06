import { Trophy, ArrowUpRight, Dumbbell } from "lucide-react";
import Card from "../common/Card";

export default function RecordsStats({ allTimeMax, initialWeight, totalSets }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Card className="p-6 bg-surface-container-low/40 border-primary/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Trophy className="w-16 h-16 text-primary" />
        </div>
        <span className="text-[9px] font-label text-surface-variant uppercase tracking-widest font-black block mb-3">All-Time PR</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic text-primary leading-none">{allTimeMax}</span>
          <span className="text-[10px] font-label uppercase text-surface-variant/60 font-black italic">KG</span>
        </div>
      </Card>
      <Card className="p-6 bg-surface-container-low/40 border-white/5 relative overflow-hidden group">
        <span className="text-[9px] font-label text-surface-variant uppercase tracking-widest font-black block mb-3">Total Volume Growth</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic text-secondary leading-none">
            {((allTimeMax - initialWeight) / (initialWeight || 1) * 100).toFixed(0)}%
          </span>
          <ArrowUpRight className="w-5 h-5 text-secondary" />
        </div>
      </Card>
      <Card className="p-6 bg-surface-container-low/40 border-white/5 relative overflow-hidden group">
        <span className="text-[9px] font-label text-surface-variant uppercase tracking-widest font-black block mb-3">Total Sets Logged</span>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black italic text-white leading-none">{totalSets}</span>
          <Dumbbell className="w-5 h-5 text-white/20" />
        </div>
      </Card>
    </div>
  );
}
