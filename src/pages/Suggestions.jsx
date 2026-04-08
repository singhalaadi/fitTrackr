import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { 
  Zap, 
  Flame, 
  Dumbbell, 
  Target,
  ArrowRight,
  Activity
} from "lucide-react";
import { useUser } from "../contexts/UserContext";

const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST;

export default function Suggestions() {
  const { userData } = useUser();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [targetMuscles, setTargetMuscles] = useState([
    { id: "chest", label: "Chest" },
    { id: "back", label: "Back" },
    { id: "upper legs", label: "Legs" },
    { id: "shoulders", label: "Shoulders" },
    { id: "upper arms", label: "Arms" }
  ]);
  const [activeMuscle, setActiveMuscle] = useState("chest");

  useEffect(() => {
    const cached = sessionStorage.getItem(`ft_ex_cache_${activeMuscle}`);
    if (cached) {
      try {
        setExercises(JSON.parse(cached));
        return;
      } catch (e) { console.error("Cache error", e); }
    }
    fetchExercises();
  }, [activeMuscle]);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${activeMuscle}?limit=10`,
        {
          headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': API_HOST
          }
        }
      );
      
      if (response.status === 403) throw new Error("API KEY FORBIDDEN: Verify ExerciseDB subscription.");
      if (response.status === 422) throw new Error("INVALID CATEGORY: System calibration required.");
      if (response.status === 429) throw new Error("API LIMIT REACHED: Monthly free tier exhausted.");
      if (!response.ok) throw new Error(`SERVICE ERROR: ${response.status}`);

      const data = await response.json();
      const validData = Array.isArray(data) ? data : [];
      setExercises(validData);
      sessionStorage.setItem(`ft_ex_cache_${activeMuscle}`, JSON.stringify(validData));
    } catch (error) {
      console.error("Fetch failed", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGoalTheme = () => {
    switch (userData?.goal) {
      case "cut": return { title: "Weight Loss", color: "#f97316", icon: Flame };
      case "bulk": return { title: "Muscle Build", color: "#f97316", icon: Target };
      case "gain": return { title: "Strength Gain", color: "#f97316", icon: Zap };
      default: return { title: "Fitness Goal", color: "#f97316", icon: Dumbbell };
    }
  };

  const theme = getGoalTheme();
  const ThemeIcon = theme.icon;

  return (
    <Layout>
      <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 border-b border-white/5 pb-8 sm:pb-10">
          <div className="space-y-2 sm:space-y-3 px-1 sm:px-0">
             <div className="flex items-center gap-3">
                <div className="hidden sm:flex p-3 rounded-2xl bg-surface-container-high text-primary kinetic-glow">
                    <ThemeIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">
                    Personalized <span className="text-primary italic">Suggestions</span>
                </h1>
             </div>
             <p className="text-surface-variant font-label uppercase tracking-[0.2em] text-[8px] sm:text-[10px] ml-1 font-bold">
                Optimized for: <span className="text-primary">{theme.title}</span> // Goal Match: 98%
             </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {targetMuscles.map(m => (
                <button
                    key={m.id}
                    onClick={() => setActiveMuscle(m.id)}
                    className={`
                        px-4 sm:px-6 py-2 rounded-full font-label text-[8px] sm:text-[10px] uppercase tracking-widest border transition-all
                        ${activeMuscle === m.id ? "bg-primary text-on-primary border-primary font-black italic" : "border-outline-variant text-surface-variant/80 hover:border-on-surface/80"}
                    `}
                >
                    {m.label}
                </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 min-h-[300px]">
            {loading ? (
                Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="h-[300px] sm:h-[400px] animate-pulse bg-surface-container-low" />
                ))
            ) : error ? (
                <div className="col-span-full py-16 sm:py-20 text-center space-y-4 px-6 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="text-primary w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black italic uppercase text-primary tracking-tight">Kinetic Sync Interrupted</h3>
                    <p className="max-w-md mx-auto text-[10px] sm:text-xs font-label text-surface-variant uppercase tracking-widest leading-relaxed font-bold">
                        {error} 
                        <br/><span className="opacity-50">Please check your RapidAPI subscription or try again later.</span>
                    </p>
                    <Button variant="secondary" onClick={fetchExercises} className="mt-4 px-10 py-3 text-[10px] font-black italic uppercase tracking-widest">
                        RETRY SYNC
                    </Button>
                </div>
            ) : exercises.length > 0 ? (
                exercises.map((ex) => {
                    const optimizedImageUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${ex.id}&resolution=180&rapidapi-key=${API_KEY}`;
                    
                    return (
                        <Card key={ex.id} className="no-line-card p-0 flex flex-col group overflow-hidden border border-white/5 hover:border-primary/30 h-full">
                            <div className="relative aspect-video overflow-hidden bg-black/50">
                                <img 
                                    src={optimizedImageUrl} 
                                    alt={ex.name}
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500 scale-90 group-hover:scale-100" 
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent opacity-60" />
                                <span className="absolute bottom-4 left-4 text-[9px] sm:text-[10px] font-label uppercase tracking-[0.3em] bg-primary/20 backdrop-blur-sm px-3 py-1 rounded-full text-primary border border-primary/20">
                                    {ex.equipment}
                                </span>
                            </div>
                            <div className="p-4 sm:p-6 flex flex-col flex-1 gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors leading-tight">
                                        {ex.name}
                                    </h3>
                                    <p className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase tracking-widest font-bold">
                                        Target: <span className="text-on-surface">{ex.target}</span> // {ex.bodyPart}
                                    </p>
                                </div>
                                <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[9px] sm:text-[10px] font-label text-surface-variant uppercase italic font-bold">Recommended</span>
                                    <button className="p-2 sm:p-3 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary transition-all active:scale-90">
                                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })
            ) : (
                <div className="col-span-full py-20 text-center space-y-6">
                    <p className="font-label uppercase tracking-widest text-surface-variant italic font-black text-[10px] opacity-40">No kinetic data found for this zone.</p>
                </div>
            )}
        </section>

        <footer className="pt-12 border-t border-white/5 flex flex-col items-center gap-6 text-center">
            <div className="max-w-md space-y-2">
                <h4 className="text-xl font-black italic uppercase">Want to change your goal?</h4>
                <p className="text-xs text-surface-variant font-label leading-relaxed font-bold">
                    Update your profile to get personalized suggestions that match your current fitness focus.
                </p>
            </div>
            <Button variant="secondary" onClick={() => (window.location.href = "/onboarding")} className="italic font-black flex items-center gap-4 py-4 px-10">
                UPDATE PROFILE <ArrowRight className="w-5 h-5" />
            </Button>
        </footer>
      </div>
    </Layout>
  );
}

function Plus({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
