// THOUSAND rules engine. Pure functions, no I/O.
// Dates are local calendar dates as 'YYYY-MM-DD' strings. Sunday (weekday 0) is the Sabbath:
// nothing is ever scheduled on it and it never counts as missed.

export const SLIP_AFTER = 3; // a goal starts slipping on the 3rd scheduled day in a row with zero reps
export const MILESTONES = [[0.25, 'Quarter'], [0.5, 'Halfway'], [0.75, 'Final stretch'], [1, 'Complete']];

export const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayISO = () => iso(new Date());
export const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);

function* eachDay(start, end) {
  for (let d = toDate(start), e = toDate(end); d <= e; d.setDate(d.getDate() + 1)) yield [iso(d), d.getDay()];
}

/** Is this habit scheduled on this date? Respects its weekdays and its active window. */
export function scheduledOn(habit, day, weekday) {
  if (weekday === 0) return false;
  if (!habit.days.includes(weekday)) return false;
  if (habit.active_from && day < habit.active_from) return false;
  if (habit.active_until && day > habit.active_until) return false;
  return true;
}

/** Scheduled days for a weekday list between two dates (inclusive), Sundays excluded. */
export function countScheduled(days, start, end) {
  if (!start || !end || end < start) return 0;
  let n = 0;
  for (const [, w] of eachDay(start, end)) if (w !== 0 && days.includes(w)) n++;
  return n;
}

/** Total reps a goal needs: every habit's scheduled days inside the goal window and the habit's active window. */
export function target(goal, habits) {
  let n = 0;
  for (const h of habits) {
    const s = h.active_from && h.active_from > goal.start_date ? h.active_from : goal.start_date;
    const e = h.active_until && h.active_until < goal.end_date ? h.active_until : goal.end_date;
    n += countScheduled(h.days, s, e);
  }
  return n;
}

/**
 * Walk a goal day by day and derive everything the app shows.
 * logs: array of { habit_id, day }.
 * Returns logged reps, reps lost to slipping, effective reps, pace, streak, slipping state, and a daily history.
 */
export function evaluate(goal, habits, logs, today = todayISO()) {
  const T = target(goal, habits);
  const byDay = new Map();
  for (const l of logs) {
    if (!habits.some((h) => h.id === l.habit_id)) continue;
    byDay.set(l.day, (byDay.get(l.day) || 0) + 1);
  }
  const last = today < goal.end_date ? today : goal.end_date;
  let effective = 0, lost = 0, logged = 0, misses = 0, streak = 0, scheduledBefore = 0;
  const history = [];
  for (const [day, w] of eachDay(goal.start_date, last)) {
    const due = habits.filter((h) => scheduledOn(h, day, w)).length;
    const done = Math.min(byDay.get(day) || 0, Math.max(due, byDay.get(day) || 0));
    logged += done;
    effective += done;
    const isToday = day === today;
    if (due > 0) {
      history.push({ day, due, done });
      if (!isToday) {
        scheduledBefore += due;
        if (done === 0) {
          misses++;
          streak = 0;
          if (misses >= SLIP_AFTER) { const cut = Math.min(due, effective); effective -= cut; lost += cut; }
        } else { misses = 0; streak++; }
      } else if (done > 0) { misses = 0; streak++; }
    } else if (done > 0) {
      history.push({ day, due: 0, done });
    }
  }
  effective = Math.min(effective, T);
  const slipping = misses >= SLIP_AFTER;
  const pace = effective - scheduledBefore;
  const frac = T ? Math.min(1, effective / T) : 0;
  return { target: T, logged, lost, reps: effective, pace, streak, missed: slipping ? misses : 0, slipping, frac,
    daysLeft: Math.max(0, daysBetween(today, goal.end_date)), complete: T > 0 && effective >= T, history };
}

/** Which milestone (if any) was crossed going from `before` to `after` reps. */
export function crossedMilestone(before, after, T) {
  if (!T) return null;
  return MILESTONES.find(([v]) => before / T < v && after / T >= v) || null;
}

/** Progress of a goal's measure (0..1) from its latest check-in value. */
export function measureProgress(goal, latest) {
  if (latest == null || goal.measure_kind == null) return null;
  const from = Number(goal.start_value ?? 0), to = Number(goal.goal_value), v = Number(latest);
  if (goal.measure_kind === 'count') return to > 0 ? Math.max(0, Math.min(1, v / to)) : 0;
  const span = to - from;
  if (!span) return 0;
  return Math.max(0, Math.min(1, (v - from) / span));
}

/** Weekly or monthly pace a measure needs between now and the end date. */
export function measurePace(goal, today = todayISO()) {
  const weeks = Math.max(1, daysBetween(today, goal.end_date) / 7);
  const delta = Math.abs(Number(goal.goal_value) - Number(goal.measure_kind === 'count' ? 0 : goal.start_value));
  return { perWeek: delta / weeks, perMonth: (delta / weeks) * 4.345, weeks };
}

/** Safety checks against medical guidance for specific measures. Returns [level, message] or null. */
export function paceCheck(area, goal, today = todayISO()) {
  const { perWeek } = measurePace(goal, today);
  const r = Math.round(perWeek * 10) / 10;
  if (area === 'health' && goal.unit === 'lbs' && goal.measure_kind === 'down') {
    return perWeek > 2
      ? ['flag', `That's ${r} lbs a week. The CDC recommends 1 to 2 lbs a week. Push the date out or lower the target.`]
      : ['good', `${r} lbs a week is within the CDC's 1 to 2 lb safe pace.`];
  }
  if (goal.unit === 'mile long run' && perWeek > 1.5) return ['flag', 'Adding more than about a mile a week to a long run raises injury risk. Give it more weeks.'];
  return null;
}
