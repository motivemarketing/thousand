// Loads everything the main screens need and derives progress with the rules engine.
import { api } from './api.js';
import { evaluate, todayISO } from './rules.js';

export const state = { me: null, household: null, spouse: null, crews: [], people: {}, goals: [], logs: [], measures: [], loaded: false };

export async function loadAll() {
  const me = await api.getMe();
  const [household, crews] = await Promise.all([api.getHousehold(), api.getCrews()]);
  const spouseId = household?.memberIds.find((id) => id !== me.id) || null;
  const crewIds = [...new Set(crews.flatMap((c) => c.memberIds))].filter((id) => id !== me.id);
  const ids = [...new Set([me.id, spouseId, ...crewIds].filter(Boolean))];
  const [profiles, goals] = await Promise.all([api.getProfiles(ids.filter((i) => i !== me.id)), api.getGoals(ids, household?.id)]);
  const habitIds = goals.flatMap((g) => g.habits.map((h) => h.id));
  const [logs, measures] = await Promise.all([api.getRepLogs(habitIds), api.getMeasureLogs(goals.map((g) => g.id))]);
  Object.assign(state, { me, household, crews, logs, measures, loaded: true });
  state.people = Object.fromEntries([me, ...profiles].map((p) => [p.id, p]));
  state.spouse = spouseId ? state.people[spouseId] || { id: spouseId } : null;
  state.goals = goals;
  recompute();
  return state;
}

export function recompute() {
  const today = todayISO();
  for (const g of state.goals) {
    const hid = new Set(g.habits.map((h) => h.id));
    g.ev = evaluate(g, g.habits, state.logs.filter((l) => hid.has(l.habit_id)), today);
    const ms = state.measures.filter((m) => m.goal_id === g.id);
    g.latest = ms.length ? ms[ms.length - 1] : null;
    g.measureHistory = ms;
  }
}

const active = (g) => g.status === 'active' || g.status === 'complete';
export const myGoals = () => state.goals.filter((g) => active(g) && (g.owner_id === state.me.id || (g.household_id && g.household_id === state.household?.id)));
export const goalsOf = (uid) => state.goals.filter((g) => active(g) && (g.owner_id === uid || (uid === state.spouse?.id && g.household_id && g.household_id === state.household?.id)));
export const crewGoalsOf = (uid) => state.goals.filter((g) => active(g) && g.owner_id === uid && g.area !== 'budget');
export const loggedToday = (habitId, day = todayISO()) => state.logs.some((l) => l.habit_id === habitId && l.day === day);

/** Apply a rep change locally (instant UI), then save. Mirrors shared reps to a spouse's matching habit. */
export async function setRep(habit, goal, done, day = todayISO()) {
  const mirror = [];
  if (habit.shared && goal.owner_id && state.spouse) {
    for (const g of goalsOf(state.spouse.id)) if (g.owner_id === state.spouse.id && g.area === goal.area)
      for (const h of g.habits) if (h.shared && h.name.toLowerCase() === habit.name.toLowerCase()) mirror.push(h.id);
  }
  const touch = [habit.id, ...mirror];
  const before = state.logs;
  state.logs = state.logs.filter((l) => !(touch.includes(l.habit_id) && l.day === day));
  if (done) touch.forEach((id) => state.logs.push({ habit_id: id, day }));
  recompute();
  try { await api.logRep(habit.id, day, done); }
  catch (e) { state.logs = before; recompute(); throw e; }
}
