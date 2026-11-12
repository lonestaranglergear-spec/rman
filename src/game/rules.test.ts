import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStars,
  scoreStyleBriefSubmission,
  applyTagMatchTurn,
  validatePassableLanes,
  calculateRackSorterSendScore,
  hasMoreThanThreeInARow,
} from './rules';

test('calculateStars follows 0 / 1 / 60% / 85% spec rules', () => {
  assert.equal(calculateStars({ won: false, score: 9999, maxScore: 1000 }), 0);
  assert.equal(calculateStars({ won: true, score: 500, maxScore: 1000 }), 1);
  assert.equal(calculateStars({ won: true, score: 600, maxScore: 1000 }), 2);
  assert.equal(calculateStars({ won: true, score: 849, maxScore: 1000 }), 2);
  assert.equal(calculateStars({ won: true, score: 850, maxScore: 1000 }), 3);
  assert.equal(calculateStars({ won: true, score: 1200, maxScore: 1000 }), 3);
});

test('scoreStyleBriefSubmission calculates slot, perfect, time, and capped combo bonuses', () => {
  const r1 = scoreStyleBriefSubmission({
    totalSlots: 3,
    matchingSlots: 3,
    extraRulePassed: true,
    remainingSeconds: 10,
    currentCombo: 0,
  });
  assert.equal(r1.isPerfect, true);
  assert.equal(r1.nextCombo, 1);
  // 300 slots + 50 perfect + 50 time + 25 combo = 425
  assert.equal(r1.points, 425);

  const rCap = scoreStyleBriefSubmission({
    totalSlots: 4,
    matchingSlots: 4,
    extraRulePassed: true,
    remainingSeconds: 0,
    currentCombo: 4,
  });
  assert.equal(rCap.nextCombo, 4);
  // 400 slots + 50 perfect + 0 time + 100 combo = 550
  assert.equal(rCap.points, 550);
});

test('applyTagMatchTurn handles streak up to x4 and mismatch floor at 0', () => {
  let state = { score: 0, streak: 0 };
  state = applyTagMatchTurn({ currentScore: state.score, currentStreak: state.streak, isMatch: false });
  assert.equal(state.score, 0);
  assert.equal(state.streak, 0);

  state = applyTagMatchTurn({ currentScore: state.score, currentStreak: state.streak, isMatch: true });
  assert.equal(state.score, 100);
  assert.equal(state.streak, 1);

  state = applyTagMatchTurn({ currentScore: state.score, currentStreak: state.streak, isMatch: true });
  assert.equal(state.score, 300);
  assert.equal(state.streak, 2);

  state = applyTagMatchTurn({ currentScore: state.score, currentStreak: 4, isMatch: true });
  assert.equal(state.streak, 4);
  assert.equal(state.score, 700);
});

test('validatePassableLanes guarantees at least one open lane in Dhaka Dash', () => {
  assert.equal(validatePassableLanes([0, 1]), true);
  assert.equal(validatePassableLanes([1, 2]), true);
  assert.equal(validatePassableLanes([0, 1, 2]), false);
});

test('calculateRackSorterSendScore scales combo every 5 sends up to x5', () => {
  assert.equal(
    calculateRackSorterSendScore({ consecutiveCorrectAfterSend: 1, itemProgressRatio: 0.8 }).multiplier,
    1
  );
  assert.equal(
    calculateRackSorterSendScore({ consecutiveCorrectAfterSend: 5, itemProgressRatio: 0.8 }).multiplier,
    2
  );
  assert.equal(
    calculateRackSorterSendScore({ consecutiveCorrectAfterSend: 25, itemProgressRatio: 0.8 }).multiplier,
    5
  );
  assert.equal(
    calculateRackSorterSendScore({ consecutiveCorrectAfterSend: 40, itemProgressRatio: 0.3 }).points,
    55
  );
});

test('hasMoreThanThreeInARow detects >3 identical categories in a row', () => {
  assert.equal(hasMoreThanThreeInARow(['top', 'top', 'top', 'bottom']), false);
  assert.equal(hasMoreThanThreeInARow(['top', 'top', 'top', 'top']), true);
});
