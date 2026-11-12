export type Difficulty = 'easy' | 'medium' | 'hard';

export interface StarCalcInput {
  won: boolean;
  score: number;
  maxScore: number;
}

/**
 * Stars rule (all games):
 * 1 star = win
 * 2 stars = win with a score >= 60% of the max
 * 3 stars = win with a score >= 85% of the max
 * A loss gives 0 stars.
 */
export function calculateStars({ won, score, maxScore }: StarCalcInput): number {
  if (!won) return 0;
  if (maxScore <= 0) return 1;
  const ratio = score / maxScore;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.60) return 2;
  return 1;
}

/**
 * Game 1: Style Brief scoring
 * +100 per matching slot, +50 "Perfect Look" bonus,
 * +time bonus (remaining seconds * 5), +25 per combo level for consecutive perfect looks (combo capped at x4).
 */
export function scoreStyleBriefSubmission(params: {
  totalSlots: number;
  matchingSlots: number;
  extraRulePassed: boolean;
  remainingSeconds: number;
  currentCombo: number;
}): { points: number; isPerfect: boolean; nextCombo: number } {
  const { totalSlots, matchingSlots, extraRulePassed, remainingSeconds, currentCombo } = params;
  const isPerfect = matchingSlots === totalSlots && extraRulePassed;
  const nextCombo = isPerfect ? Math.min(4, currentCombo + 1) : 0;
  const slotPoints = matchingSlots * 100;
  const perfectBonus = isPerfect ? 50 : 0;
  const timeBonus = isPerfect || matchingSlots > 0 ? Math.max(0, Math.floor(remainingSeconds) * 5) : 0;
  const comboBonus = isPerfect ? nextCombo * 25 : 0;
  return {
    points: slotPoints + perfectBonus + timeBonus + comboBonus,
    isPerfect,
    nextCombo,
  };
}

/**
 * Game 2: Tag Match scoring
 * +100 per matched pair, streak multiplier (x1, x2, x3 up to x4),
 * time bonus (remaining seconds * 3), and -10 per mismatch (never below zero).
 */
export function applyTagMatchTurn(params: {
  currentScore: number;
  currentStreak: number;
  isMatch: boolean;
}): { score: number; streak: number; delta: number } {
  const { currentScore, currentStreak, isMatch } = params;
  if (isMatch) {
    const nextStreak = Math.min(4, currentStreak + 1);
    const delta = 100 * nextStreak;
    return {
      score: currentScore + delta,
      streak: nextStreak,
      delta,
    };
  } else {
    const nextScore = Math.max(0, currentScore - 10);
    return {
      score: nextScore,
      streak: 0,
      delta: nextScore - currentScore,
    };
  }
}

/**
 * Game 3: Dhaka Dash fair obstacle lane generator
 * Never spawn an unavoidable obstacle layout (always leave at least one passable lane out of 0, 1, 2).
 */
export function validatePassableLanes(blockedLanes: number[]): boolean {
  const uniqueBlocked = new Set(blockedLanes.filter((l) => l >= 0 && l <= 2));
  return uniqueBlocked.size < 3;
}

/**
 * Game 4: Rack Sorter scoring & sequence generator
 * +10 per correct item, combo multiplier rises every 5 consecutive correct sends (up to x5),
 * speed bonus for fast sends.
 */
export function calculateRackSorterSendScore(params: {
  consecutiveCorrectAfterSend: number;
  itemProgressRatio: number; // 0 = start of belt, 1 = end of belt
}): { points: number; multiplier: number; speedBonus: number } {
  const { consecutiveCorrectAfterSend, itemProgressRatio } = params;
  const multiplier = Math.min(5, 1 + Math.floor(consecutiveCorrectAfterSend / 5));
  const speedBonus = itemProgressRatio < 0.45 ? 5 : itemProgressRatio < 0.7 ? 2 : 0;
  const points = 10 * multiplier + speedBonus;
  return { points, multiplier, speedBonus };
}

export function hasMoreThanThreeInARow<T>(items: T[]): boolean {
  let run = 1;
  for (let i = 1; i < items.length; i++) {
    if (items[i] === items[i - 1]) {
      run++;
      if (run > 3) return true;
    } else {
      run = 1;
    }
  }
  return false;
}
