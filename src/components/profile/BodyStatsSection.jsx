export default function BodyStatsSection({ 
    gender, 
    setGender, 
    weight, 
    setWeight, 
    heightFt, 
    setHeightFt, 
    heightIn, 
    setHeightIn 
}) {
  return (
    <section className="space-y-6 sm:space-y-8">
      <h2 className="text-lg font-bold flex items-center gap-3 italic">
        <span className="text-primary font-black">03 /</span> Body Stats
      </h2>

      <div className="grid grid-cols-2 gap-6 sm:gap-8">
        {/* Gender */}
        <div className="col-span-2 space-y-3">
          <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Gender</label>
          <div className="flex gap-4">
            {['male', 'female'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setGender(s)}
                className={`
                  flex-1 py-3 sm:py-4 rounded-xl font-black italic uppercase transition-all border-2 text-sm sm:text-base
                  ${gender === s ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low border-transparent text-surface-variant hover:bg-white/5"}
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="space-y-3">
          <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Weight (KG)</label>
          <input
            type="number"
            placeholder="00.0"
            className="w-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-4 sm:p-5 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        {/* Height Feet & Inches */}
        <div className="space-y-3">
          <label className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Height (FT & IN)</label>
          <div className="flex gap-2 sm:gap-3 h-[58px] sm:h-[74px]">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="FT"
                className="w-full h-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-2 sm:p-5 pt-5 sm:pt-7 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl text-center"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
              />
              <span className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-black uppercase text-primary tracking-widest pointer-events-none">Feet</span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="IN"
                className="w-full h-full bg-surface-container-low border-0 border-b-2 border-white/5 focus:border-primary p-2 sm:p-5 pt-5 sm:pt-7 text-2xl sm:text-3xl font-black italic transition-all focus:outline-none rounded-t-xl text-center"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
              />
              <span className="absolute top-1 sm:top-2 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-black uppercase text-primary tracking-widest pointer-events-none">Inches</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
