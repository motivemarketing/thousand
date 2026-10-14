import { test } from 'node:test';
import assert from 'node:assert/strict';
import { target, evaluate, countScheduled, crossedMilestone, measureProgress, paceCheck } from '../src/lib/rules.js';

const ALL = [1, 2, 3, 4, 5, 6];

test('target skips Sundays: whole Bible in 2026 with 2 daily habits = 626', () => {
  const g = { start_date: '2026-01-01', end_date: '2026-12-31' };
  assert.equal(target(g, [{ days: ALL }, { days: ALL }]), 626);
});

test('chosen weekdays: Mon-Fri + Fridays, Oct 14 to Dec 31 2026 = 57 + 11', () => {
  assert.equal(countScheduled([1, 2, 3, 4, 5], '2026-10-14', '2026-12-31'), 57);
  assert.equal(countScheduled([5], '2026-10-14', '2026-12-31'), 11);
});

test('habit added mid-goal only counts from its active date', () => {
  const g = { start_date: '2026-10-12', end_date: '2026-10-24' }; // Mon to Sat, two weeks
  assert.equal(target(g, [{ days: ALL }, { days: ALL, active_from: '2026-10-19' }]), 12 + 6);
});

test('slipping starts on the 3rd missed scheduled day and costs that day\'s reps', () => {
  const g = { start_date: '2026-10-05', end_date: '2026-12-31' }; // Mon
  const h = [{ id: 'a', days: ALL }];
  const logs = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'].map((day) => ({ habit_id: 'a', day }));
  // Missed Fri 9, Sat 10, (Sun 11 rest), Mon 12, Tue 13. Today Wed 14 not yet logged.
  const r = evaluate(g, h, logs, '2026-10-14');
  assert.equal(r.logged, 4);
  assert.equal(r.slipping, true);
  assert.equal(r.missed, 4);
  assert.equal(r.lost, 2); // Mon 12 and Tue 13
  assert.equal(r.reps, 2);
});

test('Sunday never breaks a streak and one rep stops slipping', () => {
  const g = { start_date: '2026-10-05', end_date: '2026-12-31' };
  const h = [{ id: 'a', days: ALL }];
  const days = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-12', '2026-10-13', '2026-10-14'];
  const r = evaluate(g, h, days.map((day) => ({ habit_id: 'a', day })), '2026-10-14');
  assert.equal(r.slipping, false);
  assert.equal(r.streak, 9);
  assert.equal(r.pace, 1); // 9 logged vs 8 due before today
});

test('milestones and measure progress', () => {
  assert.deepEqual(crossedMilestone(181, 183, 730), [0.25, 'Quarter']);
  assert.equal(crossedMilestone(10, 11, 730), null);
  assert.equal(measureProgress({ measure_kind: 'down', start_value: 212, goal_value: 197 }, 206), 0.4);
  assert.equal(measureProgress({ measure_kind: 'count', start_value: 0, goal_value: 52 }, 13), 0.25);
});

test('weight pace is checked against CDC 1-2 lbs a week', () => {
  const g = { measure_kind: 'down', unit: 'lbs', start_value: 212, goal_value: 182, end_date: '2026-11-14' };
  assert.equal(paceCheck('health', g, '2026-10-14')[0], 'flag');
});

test('onboarding question ids are unique', async () => {
  const { Q } = await import('../src/lib/baseline.js');
  const ids = Q.map((q) => q.id);
  assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), []);
});
