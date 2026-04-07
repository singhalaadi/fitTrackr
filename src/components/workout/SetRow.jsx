import { Trash2, CheckCircle2 } from "lucide-react";

export default function SetRow({ 
    setIdx, 
    weight, 
    reps, 
    onUpdateSet, 
    onRemoveSet 
}) {
  return (
    <div className="grid grid-cols-4 gap-4 items-center animate-in fade-in slide-in-from-right-2">
      <div className="bg-surface-container-high h-12 flex items-center justify-center rounded-xl font-black italic text-lg text-secondary">
        {setIdx + 1}
      </div>
      <input 
        type="number"
        value={weight || ""}
        onChange={(e) => onUpdateSet(setIdx, 'weight', parseFloat(e.target.value))}
        className="bg-surface-container-high h-12 text-center rounded-xl font-black text-xl focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-surface-variant/30"
        placeholder="0"
      />
      <input 
        type="number"
        value={reps || ""}
        onChange={(e) => onUpdateSet(setIdx, 'reps', parseInt(e.target.value))}
        className="bg-surface-container-high h-12 text-center rounded-xl font-black text-xl focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-surface-variant/30"
        placeholder="0"
      />
      <div className="flex justify-center items-center">
        <button 
          onClick={() => onRemoveSet(setIdx)}
          className="p-2 text-surface-variant/80 hover:text-error transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <CheckCircle2 className={`w-6 h-6 ml-2 ${reps > 0 ? "text-primary" : "text-surface-variant/20"}`} />
      </div>
    </div>
  );
}
