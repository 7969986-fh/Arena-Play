/** Free Fire style placement points (1st..12th). Index 0 = 1st place. */
export const PLACEMENT_POINTS = [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 1];

export function placementPoints(placement: number): number {
  if (placement < 1) return 0;
  return PLACEMENT_POINTS[placement - 1] ?? 0;
}

/** Kill points + placement points. */
export function matchPoints(kills: number, placement: number): number {
  return kills + placementPoints(placement);
}
