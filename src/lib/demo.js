// Demo backend: the same functions as Supabase, stored in this browser with sample people.
// Used to try THOUSAND before accounts are set up, and for testing.
import { todayISO, addDays, toDate, iso } from './rules.js';

const KEY = 'thousand-demo-v1';
const ALL = [1, 2, 3, 4, 5, 6], WK = [1, 2, 3, 4, 5];
let db = null;
const uidN = () => Math.random().toString(36).slice(2, 10);
const load = () => { if (db) return db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch {} if (!db) db = seed('full'); return db; };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 60));

function rng(s) { let a = 0; for (const c of s) a = (a * 31 + c.charCodeAt(0)) >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function addGoal(d, g, habits, adherence = 0.85, missLast = 0, today = todayISO()) {
  const id = uidN();
  d.goals.push({ id, status: 'active', template: null, created_at: g.start_date, ...g });
  const hs = habits.map(([name, days, shared], i) => ({ id: uidN(), goal_id: id, name, days, shared: !!shared, position: i, active_from: g.start_date, active_until: null }));
  d.habits.push(...hs);
  const r = rng(id);
  const yesterday = addDays(today, -1);
  // Collect scheduled days, newest last, so the last N can be forced as misses.
  const sched = [];
  for (let day = g.start_date; day <= yesterday && day <= g.end_date; day = addDays(day, 1)) {
    const w = toDate(day).getDay();
    if (w !== 0 && hs.some((h) => h.days.includes(w))) sched.push(day);
  }
  const skip = new Set(sched.slice(sched.length - missLast));
  for (const day of sched) {
    if (skip.has(day)) continue;
    const w = toDate(day).getDay();
    for (const h of hs) if (h.days.includes(w) && r() < adherence) d.rep_logs.push({ habit_id: h.id, day });
  }
  return { id, habits: hs };
}

function seed(kind) {
  const t = todayISO(), d = { me: 'me', profiles: [], baselines: {}, marriage: {}, households: [], household_members: [], crews: [], crew_members: [], goals: [], habits: [], rep_logs: [], measure_logs: [] };
  const P = (id, first_name, last_name, phone, guide, birthday_md) => d.profiles.push({ id, first_name, last_name, phone, guide, birthday_md, photo_url: null, onboarded: true });
  P('sarah', 'Sarah', 'Miller', '(555) 555-0142', 'selah', '03-02');
  P('marcus', 'Marcus', 'Reed', '(555) 555-0177', 'ember', '11-19');
  P('dre', 'Dre', 'Johnson', '(555) 555-0190', 'volt', '07-08');
  P('caleb', 'Caleb', 'Park', '(555) 555-0123', 'tide', '01-30');
  d.profiles.push({ id: 'me', first_name: kind === 'full' ? 'Jake' : null, last_name: kind === 'full' ? 'Miller' : null, phone: kind === 'full' ? '(555) 555-0101' : null,
    guide: 'ember', birthday_md: kind === 'full' ? '05-12' : null, photo_url: null, onboarded: kind === 'full' });

  const hh = { id: 'hh1', invite_code: 'K7Q2MX', created_at: t };
  d.households.push(hh);
  d.household_members.push({ household_id: 'hh1', user_id: 'sarah' });
  d.crews.push({ id: 'crew1', name: 'Tuesday Crew', invite_code: 'TUE4RX', created_by: 'marcus', created_at: t });
  for (const u of ['marcus', 'dre', 'caleb']) d.crew_members.push({ crew_id: 'crew1', user_id: u });

  const back = (n) => addDays(t, -n), ahead = (n) => addDays(t, n);
  // Sarah
  addGoal(d, { owner_id: 'sarah', area: 'faith', title: 'Read the New Testament', measure_kind: 'count', unit: 'chapters', start_value: 0, goal_value: 260, start_date: back(60), end_date: ahead(50) }, [['Read 3 chapters of Scripture', ALL]], 0.95);
  addGoal(d, { owner_id: 'sarah', area: 'marriage', title: 'Pray together nightly', measure_kind: 'count', unit: 'nights of prayer', start_value: 0, goal_value: 78, start_date: back(40), end_date: ahead(50) }, [['Pray together before bed', ALL, true]], 0.8);
  addGoal(d, { owner_id: 'sarah', area: 'health', title: 'Sleep 7 hours', measure_kind: 'up', unit: 'hours a night', start_value: 5.5, goal_value: 7, start_date: back(20), end_date: ahead(40) }, [['Lights out 7.5 hours before my alarm', ALL]], 0.7);
  d.marriage.sarah = { mscore: 6, dates: '1', praytog: 'Rarely', conflict: 'Takes a few days', intimacy: 5 };
  // Crew
  addGoal(d, { owner_id: 'marcus', area: 'health', title: 'Run a half marathon', measure_kind: 'up', unit: 'mile long run', start_value: 3, goal_value: 13.1, start_date: back(50), end_date: ahead(100) }, [['Training run', [2, 4]], ['Long run', [6]]], 0.8, 5);
  addGoal(d, { owner_id: 'marcus', area: 'faith', title: 'Memorize 52 verses', measure_kind: 'count', unit: 'verses', start_value: 0, goal_value: 52, start_date: back(90), end_date: ahead(270) }, [['Learn this week\'s new verse', [1]], ['Recite my verses from memory', ALL]], 0.85);
  addGoal(d, { owner_id: 'dre', area: 'faith', title: 'Read the whole Bible', measure_kind: 'count', unit: 'chapters', start_value: 0, goal_value: 1189, start_date: back(200), end_date: ahead(160) }, [['Read 4 chapters of Scripture', ALL]], 0.97);
  addGoal(d, { owner_id: 'dre', area: 'parenting', title: 'Family dinner most nights', measure_kind: 'count', unit: 'family dinners', start_value: 0, goal_value: 100, start_date: back(70), end_date: ahead(80) }, [['Family dinner at the table, phones away', WK]], 0.9);
  addGoal(d, { owner_id: 'caleb', area: 'faith', title: 'Pray for my crew daily', measure_kind: 'count', unit: 'days of prayer', start_value: 0, goal_value: 78, start_date: back(30), end_date: ahead(60) }, [['Pray for each person in my crew by name', ALL]], 0.75, 3);
  addGoal(d, { owner_id: 'caleb', area: 'worklife', title: 'Laptop closed by 6', measure_kind: 'count', unit: 'evenings', start_value: 0, goal_value: 60, start_date: back(20), end_date: ahead(70) }, [['Laptop closed by 6:00', WK]], 0.85);

  if (kind === 'full') {
    d.household_members.push({ household_id: 'hh1', user_id: 'me' });
    d.crew_members.push({ crew_id: 'crew1', user_id: 'me' });
    d.baselines.me = { birthday: '1988-05-12', sex: 'Male', answers: { status: 'Married', kids: '4 or more', name: 'Jake' }, time_budget: {} };
    d.marriage.me = { mscore: 7, dates: '2', praytog: 'Rarely', conflict: 'Gets resolved the same day', intimacy: 6 };
    addGoal(d, { owner_id: 'me', area: 'faith', title: 'Read the whole Bible', measure_kind: 'count', unit: 'chapters', start_value: 0, goal_value: 1189, start_date: back(240), end_date: ahead(125) }, [['Read 4 chapters of Scripture', ALL], ['Catch-up: read 8 chapters', [6]]], 0.995);
    addGoal(d, { owner_id: 'me', area: 'marriage', title: 'Pray together nightly', measure_kind: 'count', unit: 'nights of prayer', start_value: 0, goal_value: 78, start_date: back(40), end_date: ahead(50) }, [['Pray together before bed', ALL, true]], 0.97);
    addGoal(d, { owner_id: 'me', area: 'parenting', title: 'One-on-ones with each kid', measure_kind: 'count', unit: 'one-on-ones', start_value: 0, goal_value: 96, start_date: back(70), end_date: ahead(110) }, [['One-on-one time with a kid', [2, 4, 6]], ['Put the next one-on-ones on the calendar', [1]]], 0.985);
    const h = addGoal(d, { owner_id: 'me', area: 'health', title: 'Lose weight', measure_kind: 'down', unit: 'lbs', start_value: 212, goal_value: 197, start_date: back(56), end_date: ahead(66) }, [['Stay within my calorie target', ALL], ['30 minutes of movement', ALL]], 0.995);
    [[49, 211], [42, 209.4], [35, 208.8], [28, 207], [21, 206.2], [14, 205.4], [7, 204.6]].forEach(([n, v]) => d.measure_logs.push({ goal_id: h.id, day: back(n), value: v, logged_by: 'me' }));
    addGoal(d, { owner_id: 'me', area: 'worklife', title: 'Laptop closed by 6', measure_kind: 'count', unit: 'evenings', start_value: 0, goal_value: 60, start_date: back(70), end_date: ahead(17) }, [['Laptop closed by 6:00', WK]], 0.97);
    addGoal(d, { household_id: 'hh1', owner_id: null, area: 'budget', title: 'Pay off the credit card', measure_kind: 'down', unit: '$', start_value: 8400, goal_value: 0, start_date: back(45), end_date: ahead(320) }, [['No new charges on the card', ALL, true], ['Extra payment on the card', [5], true]], 0.8, 4);
  }
  return d;
}

const ids = (rows) => rows.map((r) => r.user_id);

export const demo = {
  mode: 'demo',
  reset(kind = 'full') { db = seed(kind); save(); },
  async session() { load(); return { user: { id: 'me', email: 'you@example.com' } }; },
  onAuthChange() {},
  async signIn() {},
  async signOut() { try { localStorage.removeItem('thousand-mode'); } catch {} },
  async uid() { return 'me'; },

  async getMe() { return delay(load().profiles.find((p) => p.id === 'me')); },
  async saveMe(patch) { const p = load().profiles.find((x) => x.id === 'me'); Object.assign(p, patch); save(); },
  async uploadPhoto(blob) { return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); }); },
  async getProfiles(list) { return delay(load().profiles.filter((p) => list.includes(p.id))); },

  async getBaseline() { return delay(load().baselines.me || null); },
  async saveBaseline(b) { load().baselines.me = { ...(db.baselines.me || {}), ...b }; save(); },
  async getMarriage(userId) { return delay(load().marriage[userId] || null); },
  async saveMarriage(answers) { load().marriage.me = answers; save(); },

  async getHousehold() {
    const d = load(), m = d.household_members.find((x) => x.user_id === 'me');
    if (!m) return null;
    const h = d.households.find((x) => x.id === m.household_id);
    return delay({ ...h, memberIds: ids(d.household_members.filter((x) => x.household_id === h.id)) });
  },
  async ensureHousehold() {
    const d = load();
    if (!d.household_members.some((x) => x.user_id === 'me')) {
      const id = uidN(); d.households.push({ id, invite_code: uidN().slice(0, 6).toUpperCase() });
      d.household_members.push({ household_id: id, user_id: 'me' }); save();
    }
    return this.getHousehold();
  },
  async joinHousehold(code) {
    const d = load(), h = d.households.find((x) => x.invite_code === code.trim().toUpperCase());
    if (!h) throw new Error('That invite code isn\'t valid');
    d.household_members = d.household_members.filter((x) => x.user_id !== 'me');
    d.household_members.push({ household_id: h.id, user_id: 'me' }); save();
    return this.getHousehold();
  },
  async leaveHousehold() { load().household_members = db.household_members.filter((x) => x.user_id !== 'me'); save(); },

  async getCrews() {
    const d = load(), mine = d.crew_members.filter((m) => m.user_id === 'me').map((m) => m.crew_id);
    return delay(d.crews.filter((c) => mine.includes(c.id)).map((c) => ({ ...c, memberIds: ids(d.crew_members.filter((m) => m.crew_id === c.id)) })));
  },
  async createCrew(name) { const d = load(), c = { id: uidN(), name: name || 'Crew', invite_code: uidN().slice(0, 6).toUpperCase(), created_by: 'me' }; d.crews.push(c); d.crew_members.push({ crew_id: c.id, user_id: 'me' }); save(); return c; },
  async joinCrew(code) {
    const d = load(), c = d.crews.find((x) => x.invite_code === code.trim().toUpperCase());
    if (!c) throw new Error('That invite code isn\'t valid');
    if (!d.crew_members.some((m) => m.crew_id === c.id && m.user_id === 'me')) d.crew_members.push({ crew_id: c.id, user_id: 'me' });
    save(); return c;
  },
  async leaveCrew(crewId) { load().crew_members = db.crew_members.filter((m) => !(m.crew_id === crewId && m.user_id === 'me')); save(); },
  async peekInvite(kind, code) {
    const d = load(), C = code.trim().toUpperCase();
    if (kind === 'crew') { const c = d.crews.find((x) => x.invite_code === C); return c ? { name: c.name, members: d.crew_members.filter((m) => m.crew_id === c.id).length, from: d.profiles.find((p) => p.id === c.created_by)?.first_name } : null; }
    const h = d.households.find((x) => x.invite_code === C); return h ? { name: 'Household', members: 1, from: 'Sarah' } : null;
  },

  async getGoals(ownerIds, householdId) {
    const d = load();
    return delay(d.goals.filter((g) => g.status !== 'archived' && (ownerIds.includes(g.owner_id) || (householdId && g.household_id === householdId)))
      .map((g) => ({ ...g, habits: d.habits.filter((h) => h.goal_id === g.id).sort((a, b) => a.position - b.position) })));
  },
  async createGoal(goal, habits) {
    const d = load(), id = uidN();
    d.goals.push({ id, status: 'active', created_by: 'me', created_at: todayISO(), ...goal });
    habits.forEach((h, i) => d.habits.push({ id: uidN(), goal_id: id, name: h.name, days: h.days, shared: !!h.shared, position: i, active_from: goal.start_date, active_until: null }));
    save(); return { id };
  },
  async updateGoal(goalId, patch) { Object.assign(load().goals.find((g) => g.id === goalId), patch); save(); },
  async editHabits(goalId, { retire = [], add = [] }, from, until) {
    const d = load();
    d.habits.forEach((h) => { if (retire.includes(h.id)) h.active_until = until; });
    add.forEach((h) => d.habits.push({ id: uidN(), goal_id: goalId, name: h.name, days: h.days, shared: !!h.shared, position: h.position, active_from: from, active_until: null }));
    save();
  },
  async getRepLogs(habitIds) { const s = new Set(habitIds); return delay(load().rep_logs.filter((l) => s.has(l.habit_id))); },
  async logRep(habitId, day, done) {
    const d = load(), h = d.habits.find((x) => x.id === habitId), g = d.goals.find((x) => x.id === h.goal_id);
    const set = (hid) => { d.rep_logs = d.rep_logs.filter((l) => !(l.habit_id === hid && l.day === day)); if (done) d.rep_logs.push({ habit_id: hid, day }); };
    set(habitId);
    if (h.shared && g.owner_id) { // mirror to spouse's matching shared habit
      const hhm = d.household_members.find((x) => x.user_id === 'me');
      const spouse = hhm && d.household_members.find((x) => x.household_id === hhm.household_id && x.user_id !== 'me')?.user_id;
      d.habits.filter((x) => x.shared && x.name.toLowerCase() === h.name.toLowerCase() && x.id !== h.id)
        .filter((x) => { const gg = d.goals.find((y) => y.id === x.goal_id); return gg.owner_id === spouse && gg.area === g.area && gg.status === 'active'; })
        .forEach((x) => set(x.id));
    }
    save();
  },
  async getMeasureLogs(goalIds) { const s = new Set(goalIds); return delay(load().measure_logs.filter((m) => s.has(m.goal_id)).sort((a, b) => a.day.localeCompare(b.day))); },
  async logMeasure(goalId, day, value) { const d = load(); d.measure_logs = d.measure_logs.filter((m) => !(m.goal_id === goalId && m.day === day)); d.measure_logs.push({ goal_id: goalId, day, value, logged_by: 'me' }); save(); },

  async exportData() { return structuredClone(load()); },
  async deleteAccount() { db = null; try { localStorage.removeItem(KEY); localStorage.removeItem('thousand-mode'); } catch {} },
};
export { iso };
