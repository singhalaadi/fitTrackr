import React, { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import { 
  Calendar, 
  Search, 
  ChevronRight, 
  Clock, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp,
  History as HistoryIcon
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "workouts"),
      where("userId", "==", currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkouts(workoutData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredWorkouts = workouts.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.exercises.some(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-white/5">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              Training <span className="text-primary italic">History</span>
            </h1>
            <p className="text-surface-variant font-label uppercase tracking-widest text-[10px] sm:text-[11px] ml-1 font-bold">
                {workouts.length} SESSIONS RECORDED
            </p>
          </div>

          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH BY EXERCISE NAME..."
              className="w-full bg-surface-container-high/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-label uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-surface-variant/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        ) : filteredWorkouts.length > 0 ? (
          <div className="space-y-4">
            {filteredWorkouts.map((workout) => (
              <Card 
                key={workout.id} 
                className={`p-6 transition-all duration-300 cursor-pointer overflow-hidden border-white/5 ${expandedId === workout.id ? 'bg-surface-container-low ring-1 ring-primary/20' : 'hover:bg-surface-container-low/60'}`}
                onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-lg shadow-black/20">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-1">
                        {workout.name || "Untitled Session"}
                      </h3>
                      <div className="flex items-center gap-4 text-[9px] font-label uppercase tracking-widest text-surface-variant font-bold">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDate(workout.timestamp)}</span>
                        <span className="hidden sm:inline w-1 h-1 bg-surface-variant/30 rounded-full" />
                        <span className="flex items-center gap-1.5"><Dumbbell className="w-3 h-3 text-primary" /> {workout.exercises.length} EXERCISES</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[8px] font-label text-surface-variant uppercase tracking-[0.2em] font-black italic opacity-80">Total Weight</span>
                        <span className="text-lg font-black italic text-primary leading-tight">
                            {workout.exercises.reduce((acc, ex) => 
                                acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0
                            ).toLocaleString()} KG
                        </span>
                    </div>
                    {expandedId === workout.id ? <ChevronUp className="w-5 h-5 text-surface-variant" /> : <ChevronDown className="w-5 h-5 text-surface-variant" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === workout.id && (
                  <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    {workout.exercises.map((ex, exIdx) => (
                      <div key={exIdx} className="space-y-3">
                        <h4 className="text-sm font-black italic uppercase tracking-widest text-secondary flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {ex.name}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-colors">
                              <span className="text-[10px] font-label text-surface-variant uppercase font-black">Set {sIdx + 1}</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black italic text-white">{set.weight} <span className="text-[9px] uppercase not-italic text-surface-variant">KG</span></span>
                                <span className="text-white/20 text-xs">×</span>
                                <span className="text-lg font-black italic text-primary">{set.reps} <span className="text-[9px] uppercase not-italic text-surface-variant">REPS</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/40">
                <HistoryIcon className="w-12 h-12" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase">NO SESSIONS FOUND</h3>
                <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold opacity-80">START YOUR FIRST WORKOUT TO BUILD YOUR HISTORY</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
