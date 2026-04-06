export default function PreferencesSection({ 
    age, 
    setAge, 
    weekStartDay, 
    setWeekStartDay 
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <section className="space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-3 italic">
          <span className="text-primary font-black">05 /</span> Age
        </h2>
        <input
          type="number"
          placeholder="YOUR AGE"
          className="w-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-4 sm:p-5 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">Standard fitness assessments vary based on age</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-bold flex items-center gap-3 italic">
          <span className="text-primary font-black">06 /</span> Week Start Day
        </h2>
        <div className="flex gap-4">
          {[
            { id: 1, label: "MONDAY" },
            { id: 2, label: "TUESDAY" }
          ].map(day => (
            <button
              key={day.id}
              type="button"
              onClick={() => setWeekStartDay(day.id)}
              className={`
                flex-1 py-4 rounded-xl font-black italic uppercase transition-all border-2
                ${weekStartDay === day.id ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low border-transparent text-surface-variant hover:bg-white/5"}
              `}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">Adjusts your weekly progress charts to match your gym schedule</p>
      </section>
    </div>
  );
}
