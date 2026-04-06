import { Trophy, Flame, TrendingUp, Activity, ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyChart({
  weeklyData,
  activeBar,
  setActiveBar,
  hasDataOverall,
  startOfWeek,
  endOfWeek,
  setWeekOffset,
  weekOffset,
  maxWeeklyPeak
}) {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Weekly <span className="text-primary italic">Progress</span></h2>
          <p className="text-[8px] font-label text-surface-variant uppercase tracking-widest font-bold">
            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(endOfWeek.getTime() - 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setWeekOffset(prev => prev - 1); }}
            className="p-2 rounded-xl bg-surface-container-high text-surface-variant hover:text-primary transition-colors border border-white/5 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setWeekOffset(prev => prev + 1); }}
            disabled={weekOffset >= 0}
            className="p-2 rounded-xl bg-surface-container-high text-surface-variant hover:text-primary transition-colors border border-white/5 active:scale-95 disabled:opacity-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-[250px] w-full flex items-end justify-between px-2 sm:px-4 pb-8 relative mt-4" onClick={() => setActiveBar(null)}>
        {!hasDataOverall && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <p className="text-[10px] font-label uppercase tracking-[0.4em] text-surface-variant italic font-black opacity-80">No Workouts Logged yet</p>
          </div>
        )}
        {weeklyData.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-4 w-full h-full justify-end relative group"
            onMouseEnter={() => setActiveBar(i)}
            onMouseLeave={() => setActiveBar(null)}
            onClick={(e) => {
              e.stopPropagation();
              setActiveBar((prev) => (prev === i ? null : i));
            }}
          >
            {/* Tooltip */}
            {activeBar === i && (d.peakWeight > 0) && (
              <div className="absolute bottom-[calc(100%-40px)] z-50 animate-in fade-in zoom-in duration-200 pointer-events-none">
                <div className="bg-surface-container-highest border border-primary/30 p-3 rounded-2xl shadow-2xl min-w-[140px] space-y-2 translate-y-[-10px]">
                  <p className="text-[9px] font-black italic text-primary uppercase border-b border-white/5 pb-1 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> PR: {d.peakWeight}KG
                  </p>
                  <p className="text-[10px] font-bold text-white uppercase tracking-tighter truncate max-w-[120px]">{d.topEx || "Session"}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-surface-variant font-black uppercase flex items-center gap-1"><Flame className="w-2 h-2" /> Calories</span>
                      <span className="text-[10px] text-white font-black italic">{d.cal.toFixed(0)} kcal</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] text-surface-variant font-black uppercase flex items-center gap-1"><TrendingUp className="w-2 h-2" /> Total KG</span>
                      <span className="text-[10px] text-white font-black italic">{d.weight.toLocaleString()} kg</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[8px] text-primary/60 font-black italic uppercase flex items-center gap-1">
                    <Activity className="w-2 h-2" /> {d.reps} TOTAL REPS
                  </div>
                </div>
                <div className="w-2 h-2 bg-surface-container-highest border-r border-b border-primary/30 rotate-45 mx-auto -translate-y-1"></div>
              </div>
            )}

            <div className="relative w-8 sm:w-12 md:w-16 h-[80%] flex items-end">
              <div
                className={`w-full rounded-t-xl transition-all duration-500 ease-out relative ${activeBar === i ? 'brightness-125' : ''}`}
                style={{
                  height: hasDataOverall && d.peakWeight > 0 ? `${(d.peakWeight / maxWeeklyPeak) * 100}%` : '4px',
                  background: d.peakWeight > 0 ? 'linear-gradient(to top, var(--color-primary), #fbbf24)' : 'rgba(255,255,255,0.05)'
                }}
              >
                {d.peakWeight > 0 && (
                  <div className="absolute inset-0 bg-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
                )}
              </div>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-label uppercase font-black transition-colors ${activeBar === i ? 'text-primary' : 'text-surface-variant/40'}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}