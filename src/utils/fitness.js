/**
 * Calorie Burn Calculation based on MET (Metabolic Equivalent of Task) 
 * Standard methodology from calculator.net
 * 
 * Formula: Calories = (MET * 3.5 * weight_kg / 200) * duration_minutes
 * 
 * MET Values for Resistance Training:
 * - LIGHT (MET 3.5): Moderate effort, longer rest periods.
 * - HEAVY (MET 6.0): Vigorous effort, high intensity, short rest.
 * - DEFAULT (MET 5.0): Standard intensity resistance training.
 * 
 * Duration Estimation:
 * - 1.5 minutes per set (execution + moderate rest)
 */

export const calculateBurn = (totalSets, userWeight, intensity = 'MODERATE') => {
    if (!userWeight || !totalSets) return 0;
    
    const MET_MAP = {
        'LIGHT': 3.5,
        'MODERATE': 5.0,
        'HEAVY': 6.0
    };
    
    const met = MET_MAP[intensity.toUpperCase()] || 5.0;
    const weightKg = parseFloat(userWeight);
    const durationMinutes = totalSets * 1.5;
    
    const calories = (met * 3.5 * weightKg / 200) * durationMinutes;
    return Math.round(calories);
};

export const getTotalSets = (exercises) => {
    if (!exercises || !Array.isArray(exercises)) return 0;
    return exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
};
