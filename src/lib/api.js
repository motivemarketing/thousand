// Data layer. Two backends with the same functions:
//  - Supabase (real accounts) when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
//  - Demo (sample people, saved in this browser) otherwise, or when "Try the demo" is chosen
import { createClient } from '@supabase/supabase-js';
import { demo } from './demo.js';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = !!(URL_ && KEY);
const wantsDemo = () => { try { return localStorage.getItem('thousand-mode') === 'demo'; } catch { return false; } };

let sb = null;
function supa() {
  if (!sb) sb = createClient(URL_, KEY, { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } });
  return sb;
}
const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

const real = {
  mode: 'live',
  async session() { const { data } = await supa().auth.getSession(); return data.session; },
  onAuthChange(cb) { supa().auth.onAuthStateChange((_e, s) => cb(s)); },
  async signIn(email) {
    must(await supa().auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/' } }));
  },
  async verifyCode(email, token) { must(await supa().auth.verifyOtp({ email, token, type: 'email' })); },
  async signOut() { await supa().auth.signOut(); },
  async uid() { return (await this.session())?.user?.id; },

  async getMe() {
    const id = await this.uid();
    const rows = must(await supa().from('profiles').select('*').eq('id', id));
    return rows[0] || { id, onboarded: false };
  },
  async saveMe(patch) { const id = await this.uid(); must(await supa().from('profiles').upsert({ id, ...patch })); },
  async uploadPhoto(blob) {
    const id = await this.uid(), path = `${id}/${Date.now()}.jpg`;
    must(await supa().storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true }));
    return supa().storage.from('avatars').getPublicUrl(path).data.publicUrl;
  },
  async getProfiles(ids) { return ids.length ? must(await supa().from('profiles').select('*').in('id', ids)) : []; },

  async getBaseline() { const id = await this.uid(); return must(await supa().from('baselines').select('*').eq('user_id', id))[0] || null; },
  async saveBaseline(b) { const id = await this.uid(); must(await supa().from('baselines').upsert({ user_id: id, ...b, updated_at: new Date().toISOString() })); },
  async getMarriage(userId) { return must(await supa().from('marriage_answers').select('*').eq('user_id', userId))[0]?.answers || null; },
  async saveMarriage(answers) { const id = await this.uid(); must(await supa().from('marriage_answers').upsert({ user_id: id, answers })); },

  async getHousehold() {
    const id = await this.uid();
    const m = must(await supa().from('household_members').select('household_id').eq('user_id', id))[0];
    if (!m) return null;
    const h = must(await supa().from('households').select('*').eq('id', m.household_id))[0];
    const mem = must(await supa().from('household_members').select('user_id').eq('household_id', h.id)).map((r) => r.user_id);
    return { ...h, memberIds: mem };
  },
  async ensureHousehold() { must(await supa().rpc('ensure_household')); return this.getHousehold(); },
  async joinHousehold(code) { must(await supa().rpc('join_household', { p_code: code })); return this.getHousehold(); },
  async leaveHousehold() { const id = await this.uid(); must(await supa().from('household_members').delete().eq('user_id', id)); },

  async getCrews() {
    const id = await this.uid();
    const mine = must(await supa().from('crew_members').select('crew_id').eq('user_id', id)).map((r) => r.crew_id);
    if (!mine.length) return [];
    const crews = must(await supa().from('crews').select('*').in('id', mine));
    const mem = must(await supa().from('crew_members').select('crew_id,user_id').in('crew_id', mine));
    return crews.map((c) => ({ ...c, memberIds: mem.filter((m) => m.crew_id === c.id).map((m) => m.user_id) }));
  },
  async createCrew(name) { return must(await supa().rpc('create_crew', { p_name: name })); },
  async joinCrew(code) { return must(await supa().rpc('join_crew', { p_code: code })); },
  async leaveCrew(crewId) { const id = await this.uid(); must(await supa().from('crew_members').delete().eq('crew_id', crewId).eq('user_id', id)); },
  async peekInvite(kind, code) { return must(await supa().rpc('peek_invite', { p_kind: kind, p_code: code })); },

  async getGoals(ownerIds, householdId) {
    let q = supa().from('goals').select('*, habits(*)').neq('status', 'archived');
    const ors = [`owner_id.in.(${ownerIds.join(',')})`];
    if (householdId) ors.push(`household_id.eq.${householdId}`);
    q = q.or(ors.join(','));
    return must(await q).map((g) => ({ ...g, habits: (g.habits || []).sort((a, b) => a.position - b.position) }));
  },
  async createGoal(goal, habits) {
    const id = await this.uid();
    const g = must(await supa().from('goals').insert({ ...goal, created_by: id }).select())[0];
    must(await supa().from('habits').insert(habits.map((h, i) => ({ goal_id: g.id, name: h.name, days: h.days, shared: !!h.shared, position: i, active_from: goal.start_date }))));
    return g;
  },
  async updateGoal(goalId, patch) { must(await supa().from('goals').update(patch).eq('id', goalId)); },
  // Change a goal's reps mid-goal: retired reps stop counting after `until`, new reps count from `from`. Past days keep their old schedule.
  async editHabits(goalId, { retire = [], add = [] }, from, until) {
    if (retire.length) must(await supa().from('habits').update({ active_until: until }).in('id', retire));
    if (add.length) must(await supa().from('habits').insert(add.map((h) => ({ goal_id: goalId, name: h.name, days: h.days, shared: !!h.shared, position: h.position, active_from: from }))));
  },
  async getRepLogs(habitIds) {
    if (!habitIds.length) return [];
    const out = [];
    for (let i = 0; i < habitIds.length; i += 100) out.push(...must(await supa().from('rep_logs').select('habit_id,day').in('habit_id', habitIds.slice(i, i + 100))));
    return out;
  },
  async logRep(habitId, day, done) { must(await supa().rpc('log_rep', { p_habit: habitId, p_day: day, p_done: done })); },
  async getMeasureLogs(goalIds) { return goalIds.length ? must(await supa().from('measure_logs').select('*').in('goal_id', goalIds).order('day')) : []; },
  async logMeasure(goalId, day, value) { const id = await this.uid(); must(await supa().from('measure_logs').upsert({ goal_id: goalId, day, value, logged_by: id })); },

  async exportData() {
    const id = await this.uid();
    const [profile, baseline, marriage, goals] = await Promise.all([this.getMe(), this.getBaseline(), this.getMarriage(id), this.getGoals([id], (await this.getHousehold())?.id)]);
    const logs = await this.getRepLogs(goals.flatMap((g) => g.habits.map((h) => h.id)));
    const measures = await this.getMeasureLogs(goals.map((g) => g.id));
    return { exported_at: new Date().toISOString(), profile, baseline, marriage, goals, rep_logs: logs, measure_logs: measures };
  },
  async deleteAccount() { must(await supa().rpc('delete_my_account')); await supa().auth.signOut(); },
};

export const api = new Proxy({}, {
  get(_t, k) { const b = (!configured || wantsDemo()) ? demo : real; const v = b[k]; return typeof v === 'function' ? v.bind(b) : v; },
});
export function useDemo(on) { try { on ? localStorage.setItem('thousand-mode', 'demo') : localStorage.removeItem('thousand-mode'); } catch {} }
