import { CheckCircle2 } from "lucide-react";

export default function GoalSection({ 
    goals, 
    selectedGoal, 
    setSelectedGoal 
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-3 italic">
        <span className="text-primary font-black">04 /</span> Fitness Goal
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => setSelectedGoal(goal.id)}
            className={`
              p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all text-center group relative overflow-hidden
              ${selectedGoal === goal.id ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "border-transparent bg-surface-container-low/60 hover:bg-white/5"}
            `}
          >
            <goal.icon className={`w-8 h-8 ${selectedGoal === goal.id ? "text-primary scale-110" : "text-surface-variant font-black"} transition-transform`} />
            <span className={`text-xl font-black italic uppercase leading-none ${selectedGoal === goal.id ? "text-primary" : "text-white"}`}>{goal.title}</span>
            {selectedGoal === goal.id && (
              <div className="absolute top-3 right-3 animate-pulse">
                <CheckCircle2 className="w-3 h-3 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
