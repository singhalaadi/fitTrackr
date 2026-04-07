import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Button from "../components/common/Button";
import {
  Play,
  Dumbbell,
  Timer,
  Zap,
  Leaf
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";

// Modular Components
import ExerciseCard from "../components/workout/ExerciseCard";

const STORAGE_KEY = "ft_active_session";

export default function WorkoutLogger() {
  const { currentUser } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [intensity, setIntensity] = useState("MODERATE");
  const [lastEfforts, setLastEfforts] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (isActive && currentUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId: currentUser.uid,
        name: workoutName,
        exercises,
        intensity,
        sessionId,
        updatedAt: Date.now()
      }));
    }
  }, [isActive, workoutName, exercises, intensity, sessionId, currentUser]);

  const addExercise = () => {
    setExercises([...exercises, {
      id: Date.now(),
      name: "",
      sets: [{ reps: 0, weight: 0 }]
    }]);
  };

  const removeExercise = (exerciseId) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const addSet = (exerciseId) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] }
        : ex
    ));
  };

  const removeSet = (exerciseId, setIdx) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) }
        : ex
    ));
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setExercises(exercises.map(ex =>
      ex.id === exerciseId
        ? {
          ...ex,
          sets: ex.sets.map((s, i) => i === setIndex ? { ...s, [field]: value } : s)
        }
        : ex
    ));
  };

  const handleExerciseNameChange = (exerciseId, name) => {
    setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, name } : ex));
    if (name.length > 3) fetchLastEffort(name);
  };

  const fetchLastEffort = async (exName) => {
    if (!exName || exName.length < 3) return;
    try {
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        const data = d.data();
        const found = data.exercises.find(e => e.name.toLowerCase() === exName.toLowerCase());
        if (found) {
          const bestSet = found.sets.reduce((prev, curr) => (parseFloat(curr.weight || 0) > parseFloat(prev.weight || 0) ? curr : prev), found.sets[0]);
          setLastEfforts(prev => ({ ...prev, [exName.toLowerCase()]: bestSet }));
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching last effort:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const initLogger = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const isToday = new Date(data.updatedAt).toDateString() === new Date().toDateString();
          if (data.userId === currentUser.uid && isToday) {
            setExercises(data.exercises);
            setWorkoutName(data.name);
            setIntensity(data.intensity || "MODERATE");
            setSessionId(data.sessionId);
            setIsActive(true);
            toast.success("Ready to continue!");
            return;
          }
        } catch (e) {
          console.error("Error parsing saved session", e);
        }
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const q = query(
        collection(db, "workouts"),
        where("userId", "==", currentUser.uid),
        where("timestamp", ">=", now),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        setExercises(data.exercises);
        setWorkoutName(data.name);
        setIntensity(data.intensity || "MODERATE");
        setSessionId(d.id);
        setIsActive(true);
        toast.success("Resuming Today's Session!");
      } else {
        setExercises([{ id: 1, name: "", sets: [{ reps: 0, weight: 0 }] }]);
      }
    };

    initLogger();
  }, [currentUser]);

  const handleFinish = async () => {
    if (exercises.some(ex => !ex.name)) {
      toast.error("Please name all exercises.");
      return;
    }
    setLoading(true);
    try {
      const workoutData = {
        userId: currentUser.uid,
        name: workoutName,
        exercises,
        intensity,
        timestamp: serverTimestamp()
      };
      if (sessionId) {
        await updateDoc(doc(db, "workouts", sessionId), workoutData);
        toast.success("Workout Updated!");
      } else {
        const res = await addDoc(collection(db, "workouts"), workoutData);
        setSessionId(res.id);
        toast.success("Workout Recorded!");
      }

      localStorage.removeItem(STORAGE_KEY);
      setIsActive(false);
    } catch (error) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Abandon current session data?")) {
      localStorage.removeItem(STORAGE_KEY);
      setIsActive(false);
      setExercises([{ id: 1, name: "", sets: [{ reps: 0, weight: 0 }] }]);
    }
  };

  return (
    <Layout>
      <div className={`space-y-8 transition-all duration-500 pb-12 ${isActive ? "kinetic-glow" : ""}`}>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-6 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-surface-variant group-hover:bg-primary transition-colors"}`} />
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                Workout <span className="text-secondary italic">Logger</span>
              </h1>
            </div>
            <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest ml-4 font-bold italic opacity-60">
              {isActive ? "ACTIVE WORKOUT" : "READY TO TRAIN"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant={isActive ? "secondary" : "primary"} onClick={isActive ? handleCancel : () => setIsActive(true)} className="px-8 font-black italic rounded-2xl h-14">
              {isActive ? "CANCEL" : "START WORKOUT"}
            </Button>
            {isActive && (
              <Button onClick={handleFinish} disabled={loading} className="px-8 font-black italic shadow-lg shadow-primary/20 rounded-2xl h-14">
                {loading ? "SAVING..." : "FINISH"}
              </Button>
            )}
          </div>
        </header>

        {isActive ? (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
            {/* Header Settings */}
            <div className="flex flex-col sm:flex-row gap-6 p-6 bg-surface-container-low/40 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-label uppercase tracking-widest text-surface-variant font-black">WORKOUT NAME</label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="bg-transparent border-0 border-b border-white/10 focus:border-primary text-2xl uppercase italic text-primary w-full focus:outline-none transition-colors placeholder:text-surface-variant/30 font-bold"
                  placeholder="WORKOUT NAME"
                />
              </div>
              <div className="space-y-3 w-full sm:w-80">
                <label className="text-[9px] font-label uppercase tracking-widest text-surface-variant font-black">Workout Intensity</label>
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full">
                  <button
                    onClick={() => setIntensity("LIGHT")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${intensity === "LIGHT" ? "bg-secondary text-white shadow-lg scale-[0.98]" : "text-surface-variant hover:text-white"}`}
                  >
                    <Leaf className={`w-3.5 h-3.5 ${intensity === "LIGHT" ? "animate-bounce" : ""}`} /> LIGHT
                  </button>
                  <button
                    onClick={() => setIntensity("HEAVY")}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${intensity === "HEAVY" ? "bg-primary text-on-primary shadow-lg scale-[0.98]" : "text-surface-variant hover:text-white"}`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${intensity === "HEAVY" ? "animate-[pulse_1s_infinite]" : ""}`} /> HEAVY
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onRemoveExercise={removeExercise}
                  onAddSet={addSet}
                  onRemoveSet={removeSet}
                  onUpdateSet={updateSet}
                  onNameChange={handleExerciseNameChange}
                  lastEffort={lastEfforts[ex.name.toLowerCase()]}
                />
              ))}
            </div>
            <Button variant="secondary" onClick={addExercise} className="w-full py-6 text-sm font-label uppercase font-black italic gap-3 border-white/5 bg-white/5 hover:bg-white/10 rounded-3xl">
              <Dumbbell className="w-5 h-5 text-primary" /> ADD EXERCISE
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/20 shadow-inner">
              <Timer className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic">AWAITING INPUT</h3>
              <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold opacity-60">Initiate workout sequence to record performance</p>
            </div>
            <Button size="lg" onClick={() => setIsActive(true)} className="italic font-black px-12 h-16 rounded-2xl shadow-xl shadow-primary/10">
              START WORKOUT <Play className="ml-2 w-4 h-4 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
