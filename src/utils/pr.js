import {
  collection,
  query,
  where,
  getDocs,
  getDocsFromCache,
} from "firebase/firestore";
import { db } from "../config/firebase";

export const normalizeExerciseName = (name = "") => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
};

// Get the best set from an exercise.
const getBestSet = (sets = []) => {
  return sets.reduce(
    (best, set) => {
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;

      if (
        weight > best.weight ||
        (weight === best.weight && reps > best.reps)
      ) {
        return { weight, reps };
      }

      return best;
    },
    { weight: 0, reps: 0 }
  );
};

// Fetch previous-session maximum and all-time PR.
export const fetchExerciseStats = async ({
  userId,
  exerciseName,
  currentSessionId = null,
}) => {
  if (!userId || !exerciseName?.trim()) {
    return {
      previousSessionMax: null,
      allTimePR: null,
    };
  }

  const normalizedName = normalizeExerciseName(exerciseName);

  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId)
  );

  let snapshot;

  try {
    snapshot = navigator.onLine
      ? await getDocs(q)
      : await getDocsFromCache(q);
  } catch (error) {
    console.warn("Could not fetch exercise statistics:", error);

    return {
      previousSessionMax: null,
      allTimePR: null,
    };
  }

  const workouts = snapshot.docs
    .filter((item) => item.id !== currentSessionId)
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    // Ignore unfinished workouts. Older records without status
    // are treated as completed for backward compatibility.
    .filter(
      (workout) =>
        !workout.status || workout.status === "completed"
    )
    .sort((a, b) => {
      const getTime = (workout) => {
        const value = workout.completedAt || workout.timestamp;

        if (value?.toMillis) return value.toMillis();

        const parsed = new Date(value).getTime();

        return Number.isNaN(parsed) ? 0 : parsed;
      };

      return getTime(b) - getTime(a);
    });

  let previousSessionMax = null;
  let allTimePR = null;

  for (const workout of workouts) {
    const exercise = (workout.exercises || []).find(
      (item) =>
        normalizeExerciseName(item.name) === normalizedName
    );

    if (!exercise) continue;

    const bestSet = getBestSet(exercise.sets || []);

    if (bestSet.weight <= 0 || bestSet.reps <= 0) continue;

    // First matching workout is the most recent previous session.
    if (!previousSessionMax) {
      previousSessionMax = {
        ...bestSet,
        workoutName: workout.name || "Previous Workout",
      };
    }

    // Keep the all-time highest weight.
    if (
      !allTimePR ||
      bestSet.weight > allTimePR.weight ||
      (bestSet.weight === allTimePR.weight &&
        bestSet.reps > allTimePR.reps)
    ) {
      allTimePR = bestSet;
    }
  }

  return {
    previousSessionMax,
    allTimePR,
  };
};

// Existing PR detection logic.
const getPreviousBest = (workouts, exerciseName) => {
  const normalizedName = normalizeExerciseName(exerciseName);

  let maxWeight = 0;
  let maxRepsAtMaxWeight = 0;

  workouts.forEach((workout) => {
    const exercise = (workout.exercises || []).find(
      (ex) => normalizeExerciseName(ex.name) === normalizedName
    );

    if (!exercise) return;

    (exercise.sets || []).forEach((set) => {
      const weight = Number(set.weight) || 0;
      const reps = Number(set.reps) || 0;

      if (weight > maxWeight) {
        maxWeight = weight;
        maxRepsAtMaxWeight = reps;
      } else if (
        weight === maxWeight &&
        reps > maxRepsAtMaxWeight
      ) {
        maxRepsAtMaxWeight = reps;
      }
    });
  });

  return {
    maxWeight,
    maxRepsAtMaxWeight,
  };
};

export const detectPRs = async ({
  userId,
  exercises,
  currentSessionId = null,
}) => {
  if (!userId || !Array.isArray(exercises)) {
    return [];
  }

  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId)
  );

  let snapshot;

  try {
    snapshot = navigator.onLine
      ? await getDocs(q)
      : await getDocsFromCache(q);
  } catch (error) {
    console.warn(
      "PR history could not be loaded. Continuing without PR detection.",
      error
    );

    snapshot = { docs: [] };
  }

  const previousWorkouts = snapshot.docs
    .filter((item) => item.id !== currentSessionId)
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .filter(
      (workout) =>
        !workout.status || workout.status === "completed"
    );

  const prs = [];

  exercises.forEach((exercise) => {
    if (!exercise.name?.trim()) return;

    const previousBest = getPreviousBest(
      previousWorkouts,
      exercise.name
    );

    const validSets = (exercise.sets || [])
      .map((set) => ({
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
      }))
      .filter((set) => set.weight > 0 && set.reps > 0);

    if (!validSets.length) return;

    const bestWeight = Math.max(
      ...validSets.map((set) => set.weight)
    );

    const bestWeightSet = validSets
      .filter((set) => set.weight === bestWeight)
      .reduce(
        (best, set) =>
          set.reps > best.reps ? set : best,
        { weight: bestWeight, reps: 0 }
      );

    if (bestWeight > previousBest.maxWeight) {
      prs.push({
        exercise: exercise.name.trim(),
        type: "weight",
        previousWeight: previousBest.maxWeight,
        newWeight: bestWeight,
        reps: bestWeightSet.reps,
      });

      return;
    }

    const bestRepSet = validSets
      .filter(
        (set) => set.weight === previousBest.maxWeight
      )
      .reduce(
        (best, set) =>
          set.reps > best.reps ? set : best,
        { weight: previousBest.maxWeight, reps: 0 }
      );

    if (
      previousBest.maxWeight > 0 &&
      bestRepSet.reps > previousBest.maxRepsAtMaxWeight
    ) {
      prs.push({
        exercise: exercise.name.trim(),
        type: "reps",
        weight: previousBest.maxWeight,
        previousReps: previousBest.maxRepsAtMaxWeight,
        newReps: bestRepSet.reps,
      });
    }
  });

  return prs;
};