export interface Badge {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

export interface BadgeInput {
  totalWorkouts: number;
  totalDistanceKm: number;
  hasHeartrate: boolean;
  hasElevation: boolean;
  maxSpeed: number | null;
}

export function computeBadges(input: BadgeInput): Badge[] {
  const { totalWorkouts, totalDistanceKm, hasElevation, maxSpeed } = input;

  return [
    { id: "first", label: "Première séance", icon: "🎉", unlocked: totalWorkouts >= 1 },
    { id: "ten", label: "10 séances", icon: "💪", unlocked: totalWorkouts >= 10, progress: Math.min(100, (totalWorkouts / 10) * 100) },
    { id: "fifty", label: "50 séances", icon: "🔥", unlocked: totalWorkouts >= 50, progress: Math.min(100, (totalWorkouts / 50) * 100) },
    { id: "hundred", label: "100 km", icon: "🏅", unlocked: totalDistanceKm >= 100, progress: Math.min(100, (totalDistanceKm / 100) * 100) },
    { id: "fivehundred", label: "500 km", icon: "🏆", unlocked: totalDistanceKm >= 500, progress: Math.min(100, (totalDistanceKm / 500) * 100) },
    { id: "thousand", label: "1 000 km", icon: "👑", unlocked: totalDistanceKm >= 1000, progress: Math.min(100, (totalDistanceKm / 1000) * 100) },
    { id: "trail", label: "Traileur", icon: "⛰️", unlocked: hasElevation },
    { id: "speed", label: "Vitesse", icon: "🚀", unlocked: maxSpeed !== null && maxSpeed * 3.6 >= 15 },
  ];
}
