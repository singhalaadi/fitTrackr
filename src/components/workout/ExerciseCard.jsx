import Card from "../common/Card";
import SetRow from "./SetRow";
import { Trash2, Plus } from "lucide-react";

export default function ExerciseCard({ 
    exercise, 
    onRemoveExercise, 
    onAddSet, 
    onRemoveSet, 
    onUpdateSet, 
    onNameChange,
    lastEffort 
}) {
  return (
    <Card className="relative overflow-hidden group border-white/10">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-sm">
            <input 
              type="text"
              value={exercise.name}
              onChange={(e) => onNameChange(exercise.id, e.target.value)}
              className="bg-transparent border-0 border-b border-white/10 focus:border-primary text-xl font-bold uppercase w-full focus:outline-none transition-colors placeholder:text-surface-variant/50"
              placeholder="EXERCISE NAME"
            />
            {lastEffort && (
                <div className="mt-2 text-[9px] font-label text-primary uppercase tracking-[0.2em] font-black italic animate-in fade-in slide-in-from-left-2 transition-all">
                    Last Session: {lastEffort.weight}KG x {lastEffort.reps}
                </div>
            )}
          </div>
          <button 
            onClick={() => onRemoveExercise(exercise.id)}
            className="text-surface-variant hover:text-error transition-colors p-2"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 px-2 text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">
            <span className="text-center">SET</span>
            <span className="text-center">WEIGHT (KG)</span>
            <span className="text-center">REPS</span>
            <span></span>
        </div>

        <div className="space-y-3">
          {exercise.sets.map((set, setIdx) => (
            <SetRow 
                key={setIdx}
                setIdx={setIdx}
                weight={set.weight}
                reps={set.reps}
                onUpdateSet={(idx, field, val) => onUpdateSet(exercise.id, idx, field, val)}
                onRemoveSet={(idx) => onRemoveSet(exercise.id, idx)}
            />
          ))}
        </div>

        <button 
          onClick={() => onAddSet(exercise.id)}
          className="w-full py-4 rounded-xl border-2 border-dashed border-white/5 text-surface-variant hover:border-primary hover:text-primary transition-all font-label uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 font-bold"
        >
          <Plus className="w-4 h-4" /> ADD SET
        </button>
      </div>
    </Card>
  );
}
