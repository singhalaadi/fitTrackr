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
    if (navigator.onLine) {
      // Online: use the normal Firestore query
      snapshot = await getDocs(q);
    } else {
      // Offline: only use data already available locally
      snapshot = await getDocsFromCache(q);
    }
  } catch (error) {
    console.warn(
      "PR history could not be loaded. Continuing without PR detection.",
      error
    );

    snapshot = {
      docs: [],
    };
  }

  const previousWorkouts = snapshot.docs
    .filter((doc) => doc.id !== currentSessionId)
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
      .filter(
        (set) => set.weight > 0 && set.reps > 0
      );

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
        (set) =>
          set.weight === previousBest.maxWeight
      )
      .reduce(
        (best, set) =>
          set.reps > best.reps ? set : best,
        { weight: previousBest.maxWeight, reps: 0 }
      );

    if (
      previousBest.maxWeight > 0 &&
      bestRepSet.reps >
      previousBest.maxRepsAtMaxWeight
    ) {
      prs.push({
        exercise: exercise.name.trim(),
        type: "reps",
        weight: previousBest.maxWeight,
        previousReps:
          previousBest.maxRepsAtMaxWeight,
        newReps: bestRepSet.reps,
      });
    }
  });

  return prs;
};