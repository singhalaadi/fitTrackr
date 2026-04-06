import { useState, useEffect, useMemo } from "react";
import Layout from "../components/common/Layout";
import {
  Search,
  History as HistoryIcon,
  AlertCircle
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

// Modular Components
import ExerciseSidebar from "../components/records/ExerciseSidebar";
import ProgressChart from "../components/records/ProgressChart";
import RecordsStats from "../components/records/RecordsStats";

export default function Records() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    setError(null);
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const workoutData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkouts(workoutData);
        setLoading(false);
        if (workoutData.length > 0 && !selectedExercise) {
          const unique = Array.from(new Set(workoutData.flatMap(w => w.exercises.map(e => e.name)))).filter(n => n);
          if (unique.length > 0) setSelectedExercise(unique[0]);
        }
      },
      (err) => {
        console.error("Firestore Error:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const exerciseList = useMemo(() => {
    const unique = Array.from(new Set(workouts.flatMap(w => w.exercises.map(e => e.name.toLowerCase().trim())))).filter(n => n);
    return unique.filter(name => name.includes(searchQuery.toLowerCase())).sort((a, b) => a.localeCompare(b));
  }, [workouts, searchQuery]);

  const stats = useMemo(() => {
    if (!selectedExercise) return null;
    const data = [];
    let allTimeMax = 0, initialWeight = 0, totalSets = 0;
    workouts.forEach(w => {
      const ex = w.exercises.find(e => e.name.toLowerCase().trim() === selectedExercise.toLowerCase());
      if (ex) {
        const date = w.timestamp?.toDate ? w.timestamp.toDate() : new Date(w.timestamp);
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0)));
        if (maxWeight > 0) {
          if (initialWeight === 0) initialWeight = maxWeight;
          if (maxWeight > allTimeMax) allTimeMax = maxWeight;
          totalSets += ex.sets.length;
          data.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: maxWeight });
        }
      }
    });
    return { data, allTimeMax, initialWeight, totalSets };
  }, [workouts, selectedExercise]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Performance <span className="text-primary italic">Stats</span>
            </h1>
            <p className="text-surface-variant font-label uppercase tracking-widest text-[10px] ml-1 font-bold">
              PERFORMANCE ANALYTICS
            </p>
          </div>
          <div className="relative group max-w-xs w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-variant group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="SEARCH EXERCISES..."
              className="w-full bg-surface-container-low border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-[10px] font-label uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-surface-variant/30 font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {error ? (
          <div className="bg-error/10 border border-error/20 p-8 rounded-[40px] text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-error mx-auto opacity-50" />
            <h3 className="text-xl font-black italic uppercase text-error">Database Index Required</h3>
            <p className="text-sm font-bold text-surface-variant max-w-md mx-auto uppercase tracking-wider">
              This page requires a composite index to calculate your multi-exercise gains.
              Please click the link in your browser's developer console (F12) to enable it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <ExerciseSidebar
              exerciseList={exerciseList}
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              loading={loading}
            />
            <div className="lg:col-span-3 space-y-8">
              {selectedExercise && stats ? (
                <>
                  <RecordsStats {...stats} />
                  <ProgressChart selectedExercise={selectedExercise} data={stats.data} />
                </>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-surface-container-low/20 rounded-[40px] border border-dashed border-white/5">
                  <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/20">
                    {loading ? <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /> : <HistoryIcon className="w-12 h-12" />}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic">AWAITING SELECTION</h3>
                    <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold max-w-xs mx-auto">Select a discipline from the sidebar to view metrics</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}