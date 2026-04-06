import { Activity, ArrowUpRight } from "lucide-react";

export default function ExerciseSidebar({ 
    exerciseList, 
    selectedExercise, 
    setSelectedExercise, 
    loading 
}) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bg-surface-container-low/30 backdrop-blur-md rounded-3xl p-1.5 border border-white/5 overflow-hidden transition-all h-full">
        <div className="max-h-[65vh] overflow-y-auto custom-scrollbar space-y-1 pr-1.5 md:pr-1">
          {exerciseList.map((ex) => (
            <button
              key={ex}
              onClick={() => setSelectedExercise(ex)}
              className={`
                w-full py-3 px-5 rounded-[20px] text-left transition-all relative group
                ${selectedExercise.toLowerCase() === ex.toLowerCase() 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[0.98]" 
                  : "hover:bg-white/5 text-surface-variant/70 hover:text-white"
                }
              `}
            >
              <span className={`text-[10px] font-black italic uppercase tracking-wider block truncate ${selectedExercise.toLowerCase() === ex.toLowerCase() ? "italic" : "opacity-80"}`}>{ex}</span>
              {selectedExercise.toLowerCase() === ex.toLowerCase() && (
                <ArrowUpRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60 animate-in fade-in slide-in-from-left-2" />
              )}
            </button>
          ))}
          
          {exerciseList.length === 0 && !loading && (
            <div className="py-16 text-center space-y-3 opacity-40">
              <Activity className="w-8 h-8 text-surface-variant mx-auto animate-pulse" />
              <p className="text-[8px] font-label uppercase text-surface-variant tracking-widest px-4 font-black">No matches found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
