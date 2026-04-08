import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Card from "../components/common/Card";
import {
    Calendar,
    Search,
    Clock,
    Dumbbell,
    ChevronDown,
    ChevronUp,
    History as HistoryIcon,
    Trash2,
    Edit3,
    Flame,
    Zap,
    Leaf
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, limit, startAfter, getDocs } from "firebase/firestore";
import { calculateBurn, getTotalSets } from "../utils/fitness";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { WifiOff } from "lucide-react";

export default function History() {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const { currentUser } = useAuth();
    const { userData } = useUser();
    const navigate = useNavigate();

    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const fetchWorkouts = async () => {
            const q = query(
                collection(db, "workouts"),
                where("userId", "==", currentUser.uid),
                orderBy("timestamp", "desc"),
                limit(10)
            );

            try {
                const snapshot = await getDocs(q);
                const workoutData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setWorkouts(workoutData);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === 10);
            } catch (err) {
                toast.error("Failed to load history");
            } finally {
                setLoading(false);
                setInitialLoading(false);
            }
        };

        fetchWorkouts();
    }, [currentUser]);

    const loadMore = async () => {
        if (!lastVisible || loadingMore) return;
        setLoadingMore(true);
        try {
            const q = query(
                collection(db, "workouts"),
                where("userId", "==", currentUser.uid),
                orderBy("timestamp", "desc"),
                startAfter(lastVisible),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const nextWorkouts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWorkouts(prev => [...prev, ...nextWorkouts]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 10);
        } catch (err) {
            toast.error("Error loading more sessions");
        } finally {
            setLoadingMore(false);
        }
    };

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
            day: 'numeric'
        }).toUpperCase();
    };

    const isToday = (timestamp) => {
        if (!timestamp) return false;
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const today = new Date();
        return date.toLocaleDateString() === today.toLocaleDateString();
    };

    const handleDelete = async (workoutId) => {
        const confirmStr = window.prompt("To delete this session, type 'DELETE' below:");
        if (confirmStr !== "DELETE") {
            if (confirmStr !== null) toast.error("Incorrect confirmation word.");
            return;
        }
        try {
            await deleteDoc(doc(db, "workouts", workoutId));
            setWorkouts(prev => prev.filter(w => w.id !== workoutId));
            toast.success("Workout Deleted");
        } catch (err) {
            toast.error("Delete failed: " + err.message);
        }
    };

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
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
                            className="w-full bg-surface-container-high/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-label uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all placeholder:text-surface-variant/30 font-bold"
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
                        {filteredWorkouts.map((workout) => {
                            const totalSets = getTotalSets(workout.exercises);
                            const kcalBurned = calculateBurn(totalSets, userData?.weight, workout.intensity || 'MODERATE');

                            return (
                                <Card
                                    key={workout.id}
                                    className={`p-6 transition-all duration-300 cursor-pointer overflow-hidden border-white/5 rounded-[30px] ${expandedId === workout.id ? 'bg-surface-container-low ring-1 ring-primary/20' : 'hover:bg-surface-container-low/60'}`}
                                    onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-lg shadow-black/20">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white leading-none">
                                                        {workout.name || "Untitled Session"}
                                                    </h3>
                                                    {workout.intensity && (
                                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/5 ${workout.intensity === 'HEAVY' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                                                            {workout.intensity === 'HEAVY' ? <Zap className="w-2.5 h-2.5" /> : <Leaf className="w-2.5 h-2.5" />} {workout.intensity}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-[9px] font-label uppercase tracking-widest text-surface-variant font-black">
                                                    <span className="flex items-center gap-1.5 opacity-60"><Clock className="w-3 h-3 text-primary" /> {formatDate(workout.timestamp)}</span>
                                                    <span className="w-1 h-1 bg-surface-variant/30 rounded-full" />
                                                    <span className="flex items-center gap-1.5 opacity-60"><Dumbbell className="w-3 h-3 text-primary" /> {workout.exercises.length} EXERCISES</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex items-center gap-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[7px] font-label text-surface-variant uppercase tracking-[0.2em] font-black italic opacity-60">Energy Burn</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Flame className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-lg font-black italic text-white leading-tight">
                                                            {kcalBurned || "---"}
                                                            <span className="text-[9px] uppercase not-italic text-surface-variant ml-1">Kcal</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[7px] font-label text-surface-variant uppercase tracking-[0.2em] font-black italic opacity-60">Total Weight</span>
                                                    <span className="text-lg font-black italic text-primary leading-tight">
                                                        {workout.exercises.reduce((acc, ex) =>
                                                            acc + ex.sets.reduce((sAcc, s) => sAcc + parseFloat(s.weight || 0), 0), 0
                                                        ).toLocaleString()}
                                                        <span className="text-[9px] uppercase not-italic text-surface-variant ml-1">KG</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 ml-4">
                                                {isToday(workout.timestamp) && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate("/workout");
                                                            }}
                                                            className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all border border-primary/20"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(workout.id);
                                                            }}
                                                            className="p-3 rounded-xl bg-error/10 text-error hover:bg-error hover:text-on-primary transition-all border border-error/20"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {expandedId === workout.id ? <ChevronUp className="w-5 h-5 text-surface-variant" /> : <ChevronDown className="w-5 h-5 text-surface-variant" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedId === workout.id && (
                                        <div className="mt-10 pt-10 border-t border-white/5 space-y-8 animate-in slide-in-from-top-4 duration-300">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {workout.exercises.map((ex, exIdx) => (
                                                    <div key={exIdx} className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-black italic uppercase tracking-widest text-primary flex items-center gap-3">
                                                                <span className="w-1 h-3 bg-primary rounded-full" />
                                                                {ex.name}
                                                            </h4>
                                                            <span className="text-[8px] font-label text-surface-variant uppercase tracking-widest font-black opacity-40">{ex.sets.length} SETS TOTAL</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {ex.sets.map((set, sIdx) => (
                                                                <div key={sIdx} className="bg-black/20 p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all hover:translate-x-1">
                                                                    <span className="text-[10px] font-label text-surface-variant uppercase font-black">SET {sIdx + 1}</span>
                                                                    <div className="flex items-baseline gap-3">
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-lg font-black italic text-white leading-none">{set.weight}</span>
                                                                            <span className="text-[9px] uppercase font-bold text-surface-variant">KG</span>
                                                                        </div>
                                                                        <span className="text-white/20 text-xs font-bold leading-none">×</span>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-lg font-black italic text-primary leading-none">{set.reps}</span>
                                                                            <span className="text-[9px] uppercase font-bold text-surface-variant">REPS</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                        
                        {hasMore && (
                            <div className="flex justify-center pt-8">
                                <Button 
                                    variant="secondary" 
                                    onClick={loadMore} 
                                    disabled={loadingMore}
                                    className="px-12 py-4 font-black italic uppercase tracking-widest text-[10px] bg-white/5 border-white/5 hover:bg-white/10"
                                >
                                    {loadingMore ? "SYNCING..." : "LOAD PREVIOUS SESSIONS"}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/40 shadow-inner">
                            <HistoryIcon className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase">NO SESSIONS FOUND</h3>
                            <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold opacity-60">START YOUR FIRST WORKOUT TO BUILD YOUR HISTORY</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}