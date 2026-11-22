import { useState, useEffect } from "react";
import Layout from "../components/common/Layout";
import Button from "../components/common/Button";
import { Play, Dumbbell, Timer, Zap, Leaf } from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/useAuth";
import { useSearchParams } from "react-router-dom";
import {
  collection,
  serverTimestamp,
  Timestamp,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  detectPRs,
  fetchExerciseStats,
  normalizeExerciseName,
} from "../utils/pr";

// Modular Components
import ExerciseCard from "../components/workout/ExerciseCard";

const STORAGE_KEY = "ft_active_session";

export default function WorkoutLogger() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const editWorkoutId = searchParams.get("edit");
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [intensity, setIntensity] = useState("MODERATE");
  const [exerciseStats, setExerciseStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!sessionReady || !isActive || !currentUser) return;

    const sessionData = {
      userId: currentUser.uid,
      name: workoutName,
      exercises,
      intensity,
      status: "in_progress",

      // Keep editing separate from creating a new workout.
      sessionType: isEditing ? "edit" : "new",
      targetWorkoutId: isEditing ? sessionId : null,

      updatedAt: Date.now(),
    };

    // Immediate local backup for same-device recovery.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

    // Debounce Firestore writes to avoid saving on every keystroke.
    const timeout = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, "workoutSessions", currentUser.uid),
          {
            ...sessionData,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Failed to sync workout draft:", error);
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [
    sessionReady,
    isActive,
    currentUser,
    workoutName,
    exercises,
    intensity,
    isEditing,
    sessionId,
  ]);

  useEffect(() => {
    if (!currentUser || !isActive) return;

    const exerciseNames = [
      ...new Set(
        exercises
          .map((ex) => normalizeExerciseName(ex.name))
          .filter((name) => name.length >= 3),
      ),
    ];

    exerciseNames.forEach((name) => {
      if (!exerciseStats[name]) {
        fetchExercisePerformance(name);
      }
    });
  }, [exercises, currentUser, isActive, isEditing, sessionId]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now(),
        name: "",
        sets: [{ reps: 0, weight: 0 }],
      },
    ]);
  };

  const removeExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const addSet = (exerciseId) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] }
          : ex,
      ),
    );
  };

  const removeSet = (exerciseId, setIdx) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIdx) }
          : ex,
      ),
    );
  };

  const updateSet = (exerciseId, setIndex, field, value) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  };

  const getTodayKey = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleExerciseNameChange = (exerciseId, name) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, name } : ex)),
    );
  };

  const fetchExercisePerformance = async (exerciseName) => {
    if (!exerciseName || exerciseName.trim().length < 3) return;

    const normalizedName = normalizeExerciseName(exerciseName);

    try {
      const stats = await fetchExerciseStats({
        userId: currentUser.uid,
        exerciseName: normalizedName,
        currentSessionId: isEditing ? sessionId : null,
      });

      setExerciseStats((prev) => ({
        ...prev,
        [normalizedName]: stats,
      }));
    } catch (error) {
      console.error("Error fetching exercise performance:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    const getDate = (value) => {
      if (!value) return null;

      const date = value?.toDate ? value.toDate() : new Date(value);

      return Number.isNaN(date.getTime()) ? null : date;
    };

    const isCompletedToday = (workout) => {
      const completionDate = getDate(workout.completedAt || workout.timestamp);

      return (
        completionDate &&
        completionDate.toDateString() === new Date().toDateString()
      );
    };

    const restoreSession = (data, editing, targetId = null) => {
      if (cancelled) return;

      setWorkoutName(data.name || "");
      setExercises(data.exercises || []);
      setIntensity(data.intensity || "MODERATE");

      setSessionId(editing ? targetId : null);
      setIsEditing(editing);
      setIsActive(true);
    };

    const initLogger = async () => {
      setSessionReady(false);

      try {
        // CASE 1: Explicitly opened Edit from History.
        if (editWorkoutId) {
          const workoutRef = doc(db, "workouts", editWorkoutId);
          const workoutSnap = await getDoc(workoutRef);

          if (cancelled) return;

          if (!workoutSnap.exists()) {
            toast.error("Workout not found.");
            return;
          }

          const data = workoutSnap.data();

          if (data.userId !== currentUser.uid) {
            toast.error("You cannot edit this workout.");
            return;
          }

          if (data.status && data.status !== "completed") {
            toast.error("This workout cannot be edited.");
            return;
          }

          if (!isCompletedToday(data)) {
            toast.error("Only today's completed workouts can be edited.");
            return;
          }

          restoreSession(data, true, workoutSnap.id);

          toast.success("Workout loaded for editing!", {
            id: `edit-workout-${workoutSnap.id}`,
          });

          return;
        }

        // CASE 2: Look for an active Firestore draft.
        const draftRef = doc(db, "workoutSessions", currentUser.uid);

        let firestoreDraft = null;
        let firestoreAvailable = false;

        try {
          const draftSnap = await getDoc(draftRef);

          firestoreAvailable = true;

          if (draftSnap.exists()) {
            firestoreDraft = draftSnap.data();
          }
        } catch (error) {
          console.warn(
            "Could not load Firestore draft. Trying local backup.",
            error,
          );
        }

        if (cancelled) return;

        // CASE 3: Read the local backup too.
        let localDraft = null;

        try {
          const saved = localStorage.getItem(STORAGE_KEY);

          if (saved) {
            localDraft = JSON.parse(saved);
          }
        } catch (error) {
          console.warn("Invalid local workout backup:", error);
          localStorage.removeItem(STORAGE_KEY);
        }

        // Use the newest available draft.
        let draft = firestoreDraft;

        if (
          localDraft?.userId === currentUser.uid &&
          Array.isArray(localDraft.exercises)
        ) {
          const localTime = Number(localDraft.updatedAt) || 0;

          const firestoreTime = firestoreDraft?.updatedAt?.toMillis
            ? firestoreDraft.updatedAt.toMillis()
            : 0;

          if (!draft || localTime > firestoreTime) {
            draft = localDraft;
          }
        }

        if (
          draft &&
          draft.userId === currentUser.uid &&
          draft.status === "in_progress" &&
          Array.isArray(draft.exercises)
        ) {
          const sessionType =
            draft.sessionType || (draft.isEditing ? "edit" : "new");

          // Restore an edit draft only if its original workout
          // is still editable today.
          if (sessionType === "edit") {
            const targetId = draft.targetWorkoutId || draft.sessionId;

            if (targetId) {
              const targetSnap = await getDoc(doc(db, "workouts", targetId));

              if (cancelled) return;

              if (
                targetSnap.exists() &&
                targetSnap.data().userId === currentUser.uid &&
                (!targetSnap.data().status ||
                  targetSnap.data().status === "completed") &&
                isCompletedToday(targetSnap.data())
              ) {
                restoreSession(draft, true, targetId);

                toast.success("Editing session restored!", {
                  id: "restore-edit-session",
                });

                return;
              }
            }

            // Invalid or expired edit draft.
            localStorage.removeItem(STORAGE_KEY);

            if (firestoreAvailable) {
              try {
                await deleteDoc(draftRef);
              } catch (error) {
                console.warn("Could not clear expired edit draft:", error);
              }
            }
          }

          // Restore an unfinished new workout.
          else if (sessionType === "new") {
            restoreSession(draft, false);

            toast.success("Ready to continue!", {
              id: "restore-active-workout",
            });

            return;
          }
        }

        if (cancelled) return;

        // No valid active draft exists.
        if (firestoreAvailable) {
          localStorage.removeItem(STORAGE_KEY);
        }

        setWorkoutName("");
        setExercises([
          {
            id: Date.now(),
            name: "",
            sets: [{ reps: 0, weight: 0 }],
          },
        ]);

        setIntensity("MODERATE");
        setSessionId(null);
        setIsEditing(false);
        setIsActive(false);
      } catch (error) {
        console.error("Error initializing Workout Logger:", error);
        toast.error("Unable to load workout.");
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    };

    initLogger();

    return () => {
      cancelled = true;
    };
  }, [currentUser, editWorkoutId]);

  const startNewWorkout = () => {
    localStorage.removeItem(STORAGE_KEY);

    setWorkoutName("");
    setExercises([
      {
        id: Date.now(),
        name: "",
        sets: [{ reps: 0, weight: 0 }],
      },
    ]);

    setIntensity("MODERATE");
    setSessionId(null);
    setIsEditing(false);
    setIsActive(true);
  };

  const handleFinish = async () => {
    // Validation
    if (exercises.length === 0) {
      toast.error("Add at least one exercise.");
      return;
    }

    const hasEmptyNames = exercises.some((ex) => !ex.name.trim());

    if (hasEmptyNames) {
      toast.error("All exercises must have a name.");
      return;
    }

    const hasInvalidSets = exercises.some((ex) =>
      ex.sets.some((s) => parseFloat(s.weight) <= 0 || parseInt(s.reps) <= 0),
    );

    if (hasInvalidSets) {
      toast.error("All sets must have weight and reps > 0.");
      return;
    }

    setLoading(true);

    try {
      const workoutData = {
        userId: currentUser.uid,
        name: workoutName || "Untitled Session",
        exercises,
        intensity,
        sessionDate: getTodayKey(),
        timestamp: navigator.onLine ? serverTimestamp() : Timestamp.now(),
        completedAt: navigator.onLine ? serverTimestamp() : Timestamp.now(),
        status: "completed",
      };
      let savedWorkoutId = sessionId;
      // Existing workout: update the same Firestore document.
      if (sessionId) {
        const workoutRef = doc(db, "workouts", sessionId);

        await updateDoc(workoutRef, workoutData);

        toast.success(
          navigator.onLine
            ? "Workout Updated!"
            : "Workout Updated Offline — will sync when online.",
        );
      } else {
        // Create a new workout document first.
        const workoutRef = doc(collection(db, "workouts"));

        // Store its ID for PR detection.
        savedWorkoutId = workoutRef.id;

        await setDoc(workoutRef, workoutData);

        toast.success(
          navigator.onLine
            ? "Workout Recorded!"
            : "Workout Recorded Offline — will sync when online.",
        );
      }

      // PR detection runs after the workout has been saved.
      if (navigator.onLine) {
        detectPRs({
          userId: currentUser.uid,
          exercises,
          currentSessionId: savedWorkoutId,
        }).catch((error) => {
          console.warn("PR detection failed:", error);
        });
      }

      // Clear active session only after successful save.
      // Stop autosaving and clear the local backup.
      setIsActive(false);
      setIsEditing(false);
      setSessionId(null);
      localStorage.removeItem(STORAGE_KEY);

      // Remove the Firestore draft only after the workout
      // has been successfully saved.
      try {
        await deleteDoc(doc(db, "workoutSessions", currentUser.uid));
      } catch (draftError) {
        console.error("Failed to delete workout draft:", draftError);
        toast.error("Workout saved, but draft cleanup failed.");
      }

      // Remove explicit edit URL after successful save.
      if (editWorkoutId) {
        setSearchParams({}, { replace: true });
      }
    } catch (error) {
      console.error("Workout save failed:", error);
      toast.error("Failed to save: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Abandon current session data?")) {
      return;
    }

    // Stop the autosave effect and clear the local backup.
    setIsActive(false);
    setIsEditing(false);
    setSessionId(null);

    localStorage.removeItem(STORAGE_KEY);

    setWorkoutName("");
    setIntensity("MODERATE");

    setExercises([
      {
        id: Date.now(),
        name: "",
        sets: [{ reps: 0, weight: 0 }],
      },
    ]);

    // Remove only the active draft.
    // The original completed workout remains untouched.
    try {
      await deleteDoc(doc(db, "workoutSessions", currentUser.uid));
    } catch (error) {
      console.error("Failed to delete workout draft:", error);
      toast.error("Could not completely clear the saved draft.");
    }

    if (editWorkoutId) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <Layout>
      <div
        className={`space-y-8 transition-all duration-500 pb-12 ${isActive ? "kinetic-glow" : ""}`}
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-1.5 h-6 rounded-full ${isActive ? "bg-primary animate-pulse" : "bg-surface-variant group-hover:bg-primary transition-colors"}`}
              />
              <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
                Workout <span className="text-secondary italic">Logger</span>
              </h1>
            </div>
            <p className="text-[10px] font-label text-surface-variant uppercase tracking-widest ml-4 font-bold italic opacity-60">
              {isActive ? "ACTIVE WORKOUT" : "READY TO TRAIN"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant={isActive ? "secondary" : "primary"}
              onClick={isActive ? handleCancel : startNewWorkout}
              className="px-8 font-black italic rounded-2xl h-14"
            >
              {isActive ? "CANCEL" : "START WORKOUT"}
            </Button>
            {isActive && (
              <Button
                onClick={handleFinish}
                disabled={loading}
                className="px-8 font-black italic shadow-lg shadow-primary/20 rounded-2xl h-14"
              >
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
                <label className="text-[9px] font-label uppercase tracking-widest text-surface-variant font-black">
                  WORKOUT NAME
                </label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="bg-transparent border-0 border-b border-white/10 focus:border-primary text-2xl uppercase italic text-primary w-full focus:outline-none transition-colors placeholder:text-surface-variant/30 font-bold"
                  placeholder="WORKOUT NAME"
                />
              </div>
              <div className="space-y-3 w-full sm:w-80">
                <label className="text-[9px] font-label uppercase tracking-widest text-surface-variant font-black">
                  Workout Intensity
                </label>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    onClick={() => setIntensity("LIGHT")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      intensity === "LIGHT"
                        ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                        : "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20"
                    }`}
                  >
                    <Leaf
                      className={`w-4 h-4 ${
                        intensity === "LIGHT" ? "animate-bounce" : ""
                      }`}
                    />
                    LIGHT
                  </button>

                  <button
                    onClick={() => setIntensity("HEAVY")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      intensity === "HEAVY"
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20"
                        : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                    }`}
                  >
                    <Zap
                      className={`w-4 h-4 ${
                        intensity === "HEAVY"
                          ? "animate-[pulse_1s_infinite]"
                          : ""
                      }`}
                    />
                    HEAVY
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
                  stats={exerciseStats[normalizeExerciseName(ex.name)]}
                />
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={addExercise}
              className="w-full py-6 text-sm font-label uppercase font-black italic gap-3 border-white/5 bg-white/5 hover:bg-white/10 rounded-3xl"
            >
              <Dumbbell className="w-5 h-5 text-primary" /> ADD EXERCISE
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-surface-variant/20 shadow-inner">
              <Timer className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic">
                AWAITING INPUT
              </h3>
              <p className="text-sm font-label text-surface-variant uppercase tracking-widest font-bold opacity-60">
                Initiate workout sequence to record performance
              </p>
            </div>
            <Button
              size="lg"
              onClick={startNewWorkout}
              className="italic font-black px-12 h-16 rounded-2xl shadow-xl shadow-primary/10"
            >
              START WORKOUT <Play className="ml-2 w-4 h-4 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
