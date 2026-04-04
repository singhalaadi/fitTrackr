import React, { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  MoreVertical, 
  History,
  Dumbbell,
  Timer
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

export default function WorkoutLogger() {
  const [isActive, setIsActive] = useState(false);
  const [workoutName, setWorkoutName] = useState("Afternoon Session");
  const [exercises, setExercises] = useState([
    { id: 1, name: "Bench Press", sets: [{ reps: 10, weight: 60 }] }
  ]);
  const [lastEfforts, setLastEfforts] = useState({});
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

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
      for (const doc of snapshot.docs) {
        const data = doc.data();
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

  const handleFinish = async () => {
    if (exercises.some(ex => !ex.name)) {
      toast.error("Please name all exercises.");
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, "workouts"), {
        userId: currentUser.uid,
        name: workoutName,
        exercises,
        timestamp: serverTimestamp()
      });
      toast.success("Workout Recorded!");
      setIsActive(false);
      setExercises([]);
    } catch (error) {
      toast.error("Failed to save workout: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className={`space-y-8 transition-all duration-500 ${isActive ? "kinetic-glow" : ""}`}>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-surface-variant hover:bg-primary transition-colors"}`} />
              <h1 className="text-5xl font-black italic uppercase tracking-tighter">
                Workout <span className="text-secondary italic">Logger</span>
              </h1>
            </div>
            <p className="text-surface-variant font-label uppercase tracking-widest text-[10px] ml-6 font-bold italic">
              {isActive ? "WORKOUT IN PROGRESS" : "READY TO START"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
                variant={isActive ? "secondary" : "primary"}
                onClick={() => setIsActive(!isActive)}
                className="font-black italic px-8"
            >
              {isActive ? "CANCEL" : "START WORKOUT"}
            </Button>
            {isActive && (
              <Button 
                onClick={handleFinish}
                disabled={loading}
                className="font-black italic shadow-lg shadow-primary/20"
              >
                {loading ? "SAVING..." : "FINISH"}
              </Button>
            )}
          </div>
        </header>

        {isActive ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 font-bold">
            <input 
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="bg-transparent border-0 border-b border-white/10 focus:border-primary text-2xl font-black uppercase italic text-primary w-full focus:outline-none transition-colors placeholder:text-surface-variant/30"
              placeholder="WORKOUT NAME"
            />

            <div className="space-y-6">
              {exercises.map((ex, exIdx) => (
                <Card key={ex.id} className="relative overflow-hidden group border-white/10">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 max-w-sm">
                        <input 
                          type="text"
                          value={ex.name}
                          onChange={(e) => {
                            const newExs = [...exercises];
                            const val = e.target.value;
                            newExs[exIdx].name = val;
                            setExercises(newExs);
                            if (val.length > 3) fetchLastEffort(val);
                          }}
                          className="bg-transparent border-0 border-b border-white/10 focus:border-primary text-xl font-bold uppercase w-full focus:outline-none transition-colors placeholder:text-surface-variant/50"
                          placeholder="EXERCISE NAME"
                        />
                        {lastEfforts[ex.name.toLowerCase()] && (
                            <div className="mt-2 text-[9px] font-label text-primary uppercase tracking-[0.2em] font-black italic animate-in fade-in slide-in-from-left-2 transition-all">
                                Last Session: {lastEfforts[ex.name.toLowerCase()].weight}KG x {lastEfforts[ex.name.toLowerCase()].reps}
                            </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeExercise(ex.id)}
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
                      {ex.sets.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-4 items-center animate-in fade-in slide-in-from-right-2">
                          <div className="bg-surface-container-high h-12 flex items-center justify-center rounded-xl font-black italic text-lg text-secondary">
                            {setIdx + 1}
                          </div>
                          <input 
                            type="number"
                            value={set.weight || ""}
                            onChange={(e) => updateSet(ex.id, setIdx, 'weight', parseFloat(e.target.value))}
                            className="bg-surface-container-high h-12 text-center rounded-xl font-black text-xl focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-surface-variant/30"
                            placeholder="0"
                          />
                          <input 
                            type="number"
                            value={set.reps || ""}
                            onChange={(e) => updateSet(ex.id, setIdx, 'reps', parseInt(e.target.value))}
                            className="bg-surface-container-high h-12 text-center rounded-xl font-black text-xl focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-surface-variant/30"
                            placeholder="0"
                          />
                          <div className="flex justify-center">
                            <CheckCircle2 className={`w-6 h-6 ${set.reps > 0 ? "text-primary" : "text-surface-variant/20"}`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => addSet(ex.id)}
                      className="w-full py-4 rounded-xl border-2 border-dashed border-white/5 text-surface-variant hover:border-primary hover:text-primary transition-all font-label uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 font-bold"
                    >
                      <Plus className="w-4 h-4" /> ADD SET
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            <Button 
                variant="secondary"
                onClick={addExercise}
                className="w-full py-6 text-sm font-label uppercase font-black italic gap-3 border-white/5 bg-white/5 hover:bg-white/10"
            >
              <Dumbbell className="w-5 h-5 text-primary" /> ADD EXERCISE
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/20">
                <Timer className="w-12 h-12" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase">NO ACTIVE WORKOUT</h3>
                <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold">START A NEW WORKOUT TO TRACK YOUR PROGRESS</p>
            </div>
            <Button size="lg" onClick={() => setIsActive(true)} className="italic font-black px-12">
               START WORKOUT <Play className="ml-2 w-4 h-4 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
