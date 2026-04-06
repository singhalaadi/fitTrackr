import { ChevronLeft } from "lucide-react";

export default function ProfileHeader({ 
    userData, 
    handleBack, 
    idealRange, 
    bmi, 
    isComplete 
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        {/* Top Progress Bar */}
        <div className="flex items-center gap-3 sm:gap-4 text-surface-variant">
          <div className="w-16 sm:w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000"
              style={{ width: isComplete ? '100%' : '60%' }}
            />
          </div>
          <span className="text-[9px] sm:text-[10px] font-label uppercase tracking-widest font-black whitespace-nowrap">Progress Complete</span>
        </div>

        {userData?.profileComplete && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 group text-surface-variant hover:text-primary transition-all pr-1"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[9px] font-black italic uppercase tracking-[0.15em]">Back</span>
          </button>
        )}
      </div>

      <header className="space-y-6 sm:space-y-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/5 pb-8 sm:pb-12">
        <div>
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none">
            Profile <span className="text-primary italic">Setup</span>
          </h1>
          <p className="text-surface-variant font-label uppercase tracking-widest text-[9px] sm:text-[10px] font-bold ml-1 mt-2 sm:mt-0">
            Tell us a bit about yourself to get started
          </p>
        </div>

        <div className="flex items-center gap-8 sm:gap-12 flex-wrap">
          {idealRange && (
            <div className="flex flex-col items-start sm:items-end gap-1 animate-in slide-in-from-right-4 duration-500">
              <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Healthy Weight Range</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black italic text-surface-variant/40 leading-none">{idealRange.min} - {idealRange.max}</span>
                <span className="text-[9px] font-label uppercase text-primary font-black italic tracking-widest">KG</span>
              </div>
            </div>
          )}
          {bmi && (
            <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-4 sm:gap-0 animate-in fade-in zoom-in translate-y-0 sm:translate-y-2">
              <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-black">Current BMI</span>
              <span className="text-4xl sm:text-5xl font-black italic text-primary leading-none">{bmi}</span>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
