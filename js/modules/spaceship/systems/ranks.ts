// ranks.ts - Pilot rank table and XP thresholds

export interface RankInfo {
  rank: number;
  name: string;
  xpRequired: number;
}

/** Rank 1–10: name and total XP required to reach that rank (cumulative). */
export const RANK_TABLE: RankInfo[] = [
  { rank: 1, name: 'Cadet', xpRequired: 0 },
  { rank: 2, name: 'Ensign', xpRequired: 100 },
  { rank: 3, name: 'Lieutenant', xpRequired: 300 },
  { rank: 4, name: 'Commander', xpRequired: 600 },
  { rank: 5, name: 'Captain', xpRequired: 1000 },
  { rank: 6, name: 'Admiral', xpRequired: 1500 },
  { rank: 7, name: 'Fleet Admiral', xpRequired: 2500 },
  { rank: 8, name: 'Commodore', xpRequired: 4000 },
  { rank: 9, name: 'Grand Admiral', xpRequired: 6000 },
  { rank: 10, name: 'Legend', xpRequired: 10000 }
];

const MAX_RANK = RANK_TABLE.length;

/**
 * Get rank info by rank number (1-based).
 */
export function getRankInfo(rank: number): RankInfo {
  const clamped = Math.max(1, Math.min(rank, MAX_RANK));
  return RANK_TABLE[clamped - 1] ?? RANK_TABLE[0];
}

/**
 * XP required from start of current rank to reach next rank.
 * At max rank returns the same threshold (no further progression).
 */
export function xpToNextRank(currentRank: number): number {
  if (currentRank >= MAX_RANK) {
    return RANK_TABLE[MAX_RANK - 1].xpRequired;
  }
  const current = RANK_TABLE[currentRank - 1];
  const next = RANK_TABLE[currentRank];
  return next ? next.xpRequired - current.xpRequired : 0;
}

/**
 * Total XP required to be at the given rank (start of that rank).
 */
export function xpForRank(rank: number): number {
  const info = getRankInfo(rank);
  return info.xpRequired;
}

/**
 * Compute current rank (1-based) from total XP.
 */
export function rankFromXP(totalXP: number): number {
  let r = 1;
  for (let i = MAX_RANK - 1; i >= 0; i--) {
    if (totalXP >= RANK_TABLE[i].xpRequired) {
      r = RANK_TABLE[i].rank;
      break;
    }
  }
  return r;
}
