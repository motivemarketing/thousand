// New goal: area → ready-made or custom goal → measure → finish date (pace) → reps on chosen weekdays → review.
import { api } from '../lib/api.js';
import { state, myGoals } from '../lib/store.js';
import { countScheduled, todayISO, toDate, iso, addDays, paceCheck } from '../lib/rules.js';
import { SLEEPMID } from '../lib/baseline.js';
import { Orb, GUIDES, $, $$, esc, dial, AREAS, DAYS, SHORT, num, amt, moment, toast } from '../ui/kit.js';

const M = [1, 2, 3, 4, 5, 6], MF = [1, 2, 3, 4, 5];
function templates(b) {
  const a = b?.answers || {};
  const weight = Number(a.hw?.lb) || 200, sys = Number(a.bp?.s) || 134, sleep = SLEEPMID[a.sleep] || 6, mscore = Number(a.mscore) || 6;
  const screen = { 'Under 1 hour': 1, '1–2 hours': 1.5, '2–4 hours': 3, 'More than 4 hours': 4.5 }[a.screen] || 3;
  const work = { 'Under 30': 30, '30–40': 40, '41–50': 48, '51–60': 58, 'More than 60': 65 }[a.whours] || 58;
  return {
    faith: [
      { t: 'Read the whole Bible', kind: 'count', unit: 'chapters', from: 0, to: 1189, months: 12, reps: [['Read 4 chapters of Scripture', M]], why: '1,189 chapters. About 4 a day, Monday to Saturday, finishes in a year.' },
      { t: 'Read the New Testament', kind: 'count', unit: 'chapters', from: 0, to: 260, months: 4, reps: [['Read 3 chapters of Scripture', M]], why: '260 chapters in about 4 months.' },
      { t: 'Memorize 52 verses', kind: 'count', unit: 'verses', from: 0, to: 52, months: 12, reps: [['Review my memory verses', M]], why: 'One new verse a week for a year.' },
      { t: 'Pray for my crew daily', kind: 'count', unit: 'days of prayer', from: 0, to: 78, months: 3, reps: [['Pray for my crew by name', M]], why: 'Every day but Sunday for 3 months.' }],
    marriage: [
      { t: 'Weekly date nights', kind: 'count', unit: 'date nights', from: 0, to: 26, months: 6, reps: [['Date night', [5]]], why: 'Every Friday for 6 months.' },
      { t: 'Pray together nightly', kind: 'count', unit: 'nights of prayer', from: 0, to: 78, months: 3, reps: [['Pray together before bed', M]], why: 'Monday to Saturday for 3 months.' },
      { t: 'Read a marriage book together', kind: 'count', unit: 'chapters', from: 0, to: 12, months: 3, reps: [['Read and talk about a chapter', [3]]], why: 'One chapter a week, talked through on Wednesdays.' },
      { t: 'Raise our marriage score', kind: 'up', unit: 'out of 10', from: mscore, to: Math.min(10, mscore + 2), months: 6, reps: [['10 minutes of real conversation', M], ['Date night', [5]]], why: `Your onboarding answer was ${mscore}. Rate it together once a month.` }],
    parenting: [
      { t: 'One-on-ones with each kid', kind: 'count', unit: 'one-on-ones', from: 0, to: 72, months: 6, reps: [['One-on-one time with a kid', [2, 4, 6]]], why: '3 a week for 6 months.' },
      { t: 'Family dinner most nights', kind: 'count', unit: 'family dinners', from: 0, to: 100, months: 5, reps: [['Family dinner at the table', MF]], why: 'Weeknights at the table for 5 months.' },
      { t: 'Bible time with the kids', kind: 'count', unit: 'family devotions', from: 0, to: 72, months: 6, reps: [['Bedtime Scripture with the kids', [1, 3, 5]]], why: '3 nights a week for 6 months.' }],
    health: [
      { t: 'Lose weight', kind: 'down', unit: 'lbs', from: weight, to: Math.round(weight * 0.93), months: 4, reps: [['30 minutes of movement', M], ['No food after 8 pm', M]], why: 'Starts from your onboarding weight. CDC: 1 to 2 lbs a week is a safe pace.' },
      { t: 'Lower my blood pressure', kind: 'down', unit: 'mmHg (top number)', from: sys, to: 119, months: 6, reps: [['30 minutes of movement', M], ['Under 2,300 mg of sodium', M]], why: 'AHA: under 120/80 is normal.' },
      { t: 'Run a half marathon', kind: 'up', unit: 'mile long run', from: 3, to: 13.1, months: 5, reps: [['Run or lift', [1, 2, 4, 5]], ['Long run', [6]]], why: 'Build the Saturday long run from 3 to 13.1 miles.' },
      { t: 'Sleep 7 hours', kind: 'up', unit: 'hours a night', from: Math.min(sleep, 6.5), to: 7, months: 2, reps: [['In bed by 10:30', M], ['Phone out of the bedroom', M]], why: '7 hours is the AASM baseline.' }],
    worklife: [
      { t: 'Laptop closed by 6', kind: 'count', unit: 'evenings', from: 0, to: 60, months: 3, reps: [['Laptop closed by 6:00', MF]], why: 'Weeknights for 3 months.' },
      { t: 'Cut my screen time', kind: 'down', unit: 'hours a day', from: screen, to: Math.max(1, Math.round(screen / 2 * 2) / 2), months: 2, reps: [['Phone in the drawer by 9:00', M], ['No social apps before noon', M]], why: 'Check your phone\'s screen time report each Saturday.' },
      { t: 'Work under 50 hours', kind: 'down', unit: 'hours a week', from: Math.max(work, 52), to: 48, months: 3, reps: [['Leave work by 5:30', MF], ['Plan tomorrow before leaving', MF]], why: 'Brought into your 119-hour budget.' }],
    budget: [
      { t: 'Pay off the credit card', kind: 'down', unit: '$', from: 5000, to: 0, months: 12, reps: [['Log every purchase', M], ['24-hour rule on anything over $50', M]], why: 'Change the starting balance to yours. Smallest balance first.' },
      { t: 'Build an emergency fund', kind: 'up', unit: '$', from: 1000, to: 10000, months: 12, reps: [['Pack lunch', MF], ['5-minute budget check', [6]]], why: 'About 3 months of expenses, saved over a year.' },
      { t: 'Stick to the grocery budget', kind: 'down', unit: '$ a month', from: 1400, to: 1000, months: 3, reps: [['Meal plan for the week', [6]], ['Log every purchase', M]], why: 'Brought down over 3 months.' }],
  };
}
const UNITS = { down: ['lbs', '$', 'hours a day', 'hours a week', 'mmHg (top number)'], up: ['$', 'miles', 'hours a night', 'out of 10', 'minutes'], count: ['times', 'chapters', 'date nights', 'days', 'sessions'] };
const KINDS = { down: ['Bring a number down', 'Weight, debt, screen time'], up: ['Bring a number up', 'Savings, miles, sleep'], count: ['Do it a number of times', 'Chapters, dates, dinners'] };
const STEPS = ['area', 'pick', 'measure', 'end', 'habits', 'review'];
const plusMonths = (n) => { const d = toDate(todayISO()); d.setMonth(d.getMonth() + n); return iso(d); };

export async function render(root, { go }) {
  const T0 = todayISO();
  const qs = new URLSearchParams(location.search), isFirst = qs.get('first') === '1';
  const baseline = await api.getBaseline().catch(() => null);
  const TPL = templates(baseline);
  const spouse = state.spouse, household = state.household;
  const guideKey = state.me.guide || 'ember', guide = GUIDES[guideKey];
  const activeIn = (area) => myGoals().find((g) => g.area === area && g.status === 'active');
  const blank = (area = null) => ({ area, tpl: null, title: '', m: { kind: null, unit: '', from: '', to: '' }, end: null, habits: [] });
  let G = blank(qs.get('area') && AREAS[qs.get('area')] ? qs.get('area') : null), step = G.area ? 1 : 0, busy = false;

  root.innerHTML = `<div class="flow">
    <aside class="flow-left" id="left">
      <div class="flow-top"><span class="mark">THOUSAND<i></i></span>${isFirst ? '' : '<a class="btn small" href="/" data-link>Cancel</a>'}</div>
      <div class="flow-stage">
        <div class="guide"><canvas id="orb" style="width:72px;height:72px;flex:none;border-radius:50%" aria-hidden="true"></canvas><div style="text-align:left"><span class="lbl">${guide.name} · your guide</span><p id="say"></p></div></div>
        <div class="preview" aria-live="polite">
          <div class="pv-head"><span class="pv-area" id="pvArea"></span><span class="lbl" id="pvDates"></span></div>
          <div class="pv-body"><div class="dial ng-dial" id="pvDial"></div><div style="display:grid;gap:8px;min-width:0"><div class="pv-goal" id="pvGoal"></div><div class="math" id="pvMath"></div></div></div>
          <div class="pv-week"><span class="lbl" style="display:block;margin-bottom:8px">Reps each week</span><div class="week" id="pvWeek"></div></div>
        </div></div><div></div>
    </aside>
    <main class="flow-pane">
      <div class="flow-bar"><span class="lbl num" id="count"></span><div class="bar"><i id="barFill"></i></div><span class="lbl">${isFirst ? 'Your first goal' : 'New goal'}</span></div>
      <div class="flow-body" id="body"></div>
      <div class="flow-foot"><button class="btn ghost" id="backBtn">Back</button><button class="btn primary" id="nextBtn">Continue</button></div>
    </main></div>`;
  const body = $('#body'), nextBtn = $('#nextBtn'), backBtn = $('#backBtn');
  const orb = Orb.make($('#orb'), guideKey, { detail: 40 });
  const c = () => (G.area ? `var(--${G.area})` : 'var(--acc)');
  const sharedArea = () => G.area === 'marriage' || G.area === 'budget';
  const habitReps = (h) => (G.end ? countScheduled(h.days, T0, G.end) : 0);
  const target = () => G.habits.reduce((a, h) => a + habitReps(h), 0);
  const weeks = () => (G.end ? Math.max(1, (toDate(G.end) - toDate(T0)) / 864e5 / 7) : 0);
  const delta = () => Math.abs(G.m.to - (G.m.kind === 'count' ? 0 : G.m.from));
  const goalLike = () => ({ measure_kind: G.m.kind, unit: G.m.unit, start_value: G.m.from, goal_value: G.m.to, end_date: G.end });
  const mLine = () => { const m = G.m; if (!m.kind || m.to === '' || m.to == null || !m.unit) return ''; return m.kind === 'count' ? `0 → ${amt(m.to, m.unit)}` : `${amt(m.from, m.unit)} → ${amt(m.to, m.unit)}`; };
  function paceLine() {
    const m = G.m, w = weeks(); if (!w || !m.kind || !m.unit) return '';
    const per = delta() / w, mo = per * 4.345, u = m.unit.replace(/ a (day|week|night|month)$/, '');
    if (m.unit.startsWith('$')) return `about ${amt(Math.round(mo), '$')} a month`;
    return per >= 1 || m.kind === 'count' ? `about ${num(Math.round(per * 10) / 10)} ${u} a week` : `about ${num(Math.round(mo * 10) / 10)} ${u} a month`;
  }
  const measureOk = () => { const m = G.m; if (!m.kind || !m.unit || m.to === '' || m.to == null) return false; if (m.kind === 'count') return +m.to > 0; if (m.from === '' || m.from == null) return false; return m.kind === 'down' ? +m.to < +m.from : +m.to > +m.from; };
  const shareLabel = () => G.area === 'budget' ? (household ? `Shared with ${esc(spouse?.first_name || 'your spouse')} (household)` : 'Household goal') : `Shared with ${esc(spouse?.first_name || 'your spouse')}`;

  function say() {
    const T = target(), wk = G.habits.reduce((a, h) => a + h.days.length, 0), s = STEPS[step];
    if (s === 'area') return 'Pick one area. One goal per area, hit in the same spot every day.';
    if (s === 'pick') return 'Start from one of these, or build your own. Either way we\'ll make it measurable.';
    if (s === 'measure') return mLine() ? `${mLine()}. That's the finish line.` : 'Every goal needs a number. Where are you now, and where are you going?';
    if (s === 'end') return G.end ? `${paceLine().replace(/^about/, 'About')}. ${Math.round(weeks())} weeks to get there.` : 'Pick a date. I\'ll work out the pace.';
    if (s === 'habits') return G.habits.length ? `${wk} reps a week. These are the actions that move the number.` : 'Pick 1 to 3 reps that move the number.';
    return `${mLine()} by ${fmt(G.end)}, through ${T.toLocaleString()} reps.`;
  }
  const fmt = (d) => toDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  function preview() {
    $('#left').style.setProperty('--g1', G.area ? `var(--${G.area})` : guide.colors[0]);
    $('#pvArea').style.setProperty('--c', c());
    $('#pvArea').innerHTML = `<i></i>${G.area ? AREAS[G.area].n : 'Pick an area'}${G.area === 'budget' && household ? ' <span class="lbl" style="font-size:9.5px">Household</span>' : ''}`;
    const g = $('#pvGoal'); g.textContent = G.title || 'Your goal'; g.classList.toggle('empty', !G.title);
    const ml = mLine(), T = target(), wk = G.habits.reduce((x, h) => x + h.days.length, 0);
    $('#pvDial').innerHTML = dial(0, G.area || 'acc') + `<div class="mid"><b class="disp num" style="font-size:36px">0%</b><span class="lbl">${ml ? (G.m.kind === 'count' ? 'of ' + num(G.m.to) : num(delta()) + ' to go') : '—'}</span></div>`;
    $('#pvDates').textContent = G.end ? `${fmt(T0)} → ${fmt(G.end)}` : '';
    $('#pvMath').innerHTML = [ml ? `<b>${esc(ml)}</b>` : '', G.end && ml ? paceLine() : '', G.habits.length ? `${G.habits.length} rep${G.habits.length > 1 ? 's' : ''} · ${wk} a week${T ? ' · ' + T.toLocaleString() + ' total' : ''}` : ''].filter(Boolean).join('<br>') || 'No measure yet';
    $('#pvWeek').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((w) => { const n = G.habits.filter((h) => h.days.includes(w)).length; return `<div><span>${DAYS[w]}</span><i class="${w === 0 ? 'rest' : n ? 'on' : ''}">${w === 0 ? 'Rest' : n || ''}</i></div>`; }).join('');
    $('#say').textContent = say();
  }
  const head = (eye, q, help) => `<div style="display:grid;gap:10px"><span class="lbl" style="color:var(--c)">${eye}</span><h2 class="q">${q}</h2>${help ? `<p class="help">${help}</p>` : ''}</div>`;
  const tplMeasure = (t) => t.kind === 'count' ? `${num(t.to)} ${t.unit}` : `${amt(t.from, t.unit)} → ${amt(t.to, t.unit)}`;
  const daysText = (d) => d.length === 6 ? 'Every day but Sunday' : d.length ? d.map((w) => DAYS[w]).join(', ') : 'Pick at least one day';

  function draw() {
    $('#count').textContent = `Step ${step + 1} of ${STEPS.length}`;
    $('#barFill').style.width = (step / (STEPS.length - 1)) * 100 + '%';
    backBtn.style.visibility = step ? 'visible' : 'hidden';
    nextBtn.textContent = step === STEPS.length - 1 ? 'Start goal' : 'Continue';
    body.style.setProperty('--c', c());
    const s = STEPS[step], A = G.area && AREAS[G.area], title = esc(G.title); let h = '';
    if (s === 'area') h = `<div class="card">${head(isFirst ? 'Your first goal' : 'New goal', 'Which area?', 'One active goal per area. Budget is shared with your spouse and hidden from your crew.')}
      <div class="areas" role="radiogroup">${Object.entries(AREAS).map(([k, a]) => { const cur = activeIn(k); return `<button class="area ${G.area === k ? 'on' : ''}" role="radio" aria-checked="${G.area === k}" data-k="${k}" style="--c:var(--${k})"><b><i></i>${a.n}</b><span>${cur ? 'Active: ' + esc(cur.title) : a.hint}</span></button>`; }).join('')}</div></div>`;
    if (s === 'pick') h = `<div class="card">${head(A.n, 'Pick a goal, or make your own.', 'Ready-made goals come with a measure, a timeline and suggested reps. You can change all of it.')}
      ${activeIn(G.area) ? `<div class="note watch">You already have an active ${A.n} goal: <b>${esc(activeIn(G.area).title)}</b>. Starting this one archives it.</div>` : ''}
      <div class="tpls" role="radiogroup">${TPL[G.area].map((t, i) => `<button class="tpl ${G.tpl === i ? 'on' : ''}" role="radio" aria-checked="${G.tpl === i}" data-t="${i}"><span class="tpl-top"><b>${t.t}</b><span class="lbl">${t.months} mo</span></span><span class="tpl-m num">${tplMeasure(t)}</span><span class="tpl-w">${t.why}</span></button>`).join('')}
        <button class="tpl custom ${G.tpl === 'custom' ? 'on' : ''}" role="radio" aria-checked="${G.tpl === 'custom'}" data-t="custom"><span class="tpl-top"><b>+ Create my own</b></span><span class="tpl-w">Name it, then set the number and the date.</span></button></div>
      ${G.tpl === 'custom' ? `<div class="input"><input id="fTitle" type="text" maxlength="80" placeholder="Name your goal" value="${title}" autocomplete="off"></div>` : ''}</div>`;
    if (s === 'measure') { const m = G.m;
      h = `<div class="card">${head(A.n + ' · ' + title, 'How will you measure it?', 'Where you are now, where you\'re going, and the unit. You\'ll update the number every Saturday.')}
        <div class="seg" role="radiogroup">${Object.entries(KINDS).map(([k, [l, e]]) => `<button class="segb ${m.kind === k ? 'on' : ''}" role="radio" aria-checked="${m.kind === k}" data-kind="${k}"><b>${l}</b><span>${e}</span></button>`).join('')}</div>
        ${m.kind ? `<div class="fields">${m.kind !== 'count' ? `<div class="field"><label for="fFrom">Now</label><div class="input"><input id="fFrom" type="number" inputmode="decimal" step="any" value="${m.from}"></div></div><span class="arrow">→</span>` : ''}
          <div class="field"><label for="fTo">${m.kind === 'count' ? 'How many times' : 'Goal'}</label><div class="input"><input id="fTo" type="number" inputmode="decimal" step="any" min="0" value="${m.to}"></div></div>
          <div class="field" style="flex:1.4"><label for="fUnit">Unit</label><div class="input"><input id="fUnit" type="text" maxlength="30" value="${esc(m.unit)}" placeholder="${UNITS[m.kind][0]}"></div></div></div>
          <div class="chips">${UNITS[m.kind].map((u) => `<button class="chip ${m.unit === u ? 'on' : ''}" data-u="${u}">${u}</button>`).join('')}</div><div id="mLive"></div>` : ''}</div>`; }
    if (s === 'end') { const t = typeof G.tpl === 'number' ? TPL[G.area][G.tpl] : null;
      const opts = [...(t ? [[`Suggested · ${t.months} mo`, plusMonths(t.months)]] : []), ['90 days', addDays(T0, 89)], ['6 months', plusMonths(6)], ['1 year', plusMonths(12)]];
      const chk = G.end && paceCheck(G.area, goalLike(), T0);
      h = `<div class="card">${head(A.n + ' · ' + title, 'When will you hit it?', 'Starts today. The date sets the pace.')}
        <div class="chips">${opts.map(([l, v]) => `<button class="chip ${G.end === v ? 'on' : ''}" data-end="${v}">${l}</button>`).join('')}</div>
        <div class="input" style="max-width:280px"><input id="fEnd" type="date" min="${addDays(T0, 7)}" max="${addDays(T0, 365 * 5)}" value="${G.end || ''}" style="font-size:18px"></div>
        ${G.end ? `<div class="stats"><div><span class="lbl">Measure</span><b class="num">${esc(mLine())}</b></div><div><span class="lbl">Timeline</span><b class="num">${Math.round(weeks())} weeks</b></div><div><span class="lbl">Pace needed</span><b class="num">${esc(paceLine().replace('about ', ''))}</b></div></div>${chk ? `<div class="note ${chk[0]}">${chk[1]}</div>` : ''}` : ''}</div>`; }
    if (s === 'habits') { const left = [...new Set(TPL[G.area].flatMap((t) => t.reps.map((r) => r[0])))].filter((x) => !G.habits.some((hb) => hb.name === x));
      h = `<div class="card">${head(A.n + ' · ' + G.habits.length + ' of 3', 'Pick the reps that move the number.', 'Each check-off is one rep. Set the days for each one. Sunday is the Sabbath, so it\'s always off.')}
        ${G.habits.map((hb, i) => `<div class="habit"><div class="habit-top"><b>${esc(hb.name)}</b><button class="x" data-rm="${i}" aria-label="Remove ${esc(hb.name)}">Remove</button></div>
          <div class="days" role="group" aria-label="Days for ${esc(hb.name)}">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button class="day ${hb.days.includes(w) ? 'on' : ''}" data-h="${i}" data-w="${w}" ${w === 0 ? 'disabled aria-label="Sunday, Sabbath"' : `aria-pressed="${hb.days.includes(w)}" aria-label="${DAYS[w]}"`}>${SHORT[w]}</button>`).join('')}</div>
          <div class="habit-foot"><span>${daysText(hb.days)} · ${habitReps(hb)} reps</span>${sharedArea() && (spouse || G.area === 'budget') ? `<label class="toggle" style="--c:var(--${G.area})"><input type="checkbox" data-sh="${i}" ${hb.shared ? 'checked' : ''} ${G.area === 'budget' ? 'disabled' : ''}> ${shareLabel()}</label>` : ''}</div></div>`).join('')}
        ${G.habits.length < 3 ? `<div style="display:grid;gap:10px"><span class="lbl">Add a rep</span><div class="chips">${left.slice(0, 6).map((x) => `<button class="chip" data-add="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>
          <div style="display:flex;gap:8px"><div class="input" style="flex:1"><input id="fCustom" type="text" maxlength="60" placeholder="Or write your own" style="font-size:16px"></div><button class="btn" id="addC">Add</button></div></div>` : ''}</div>`; }
    if (s === 'review') { const T = target(), chk = paceCheck(G.area, goalLike(), T0), old = activeIn(G.area);
      h = `<div class="card">${head(A.n + ' · review', title, `${fmt(T0)} to ${fmt(G.end)}, Sundays off.`)}
        <div class="stats"><div><span class="lbl">Measure</span><b class="num">${esc(mLine())}</b></div><div><span class="lbl">Pace</span><b class="num">${esc(paceLine().replace('about ', ''))}</b></div><div><span class="lbl">Reps</span><b class="num">${T.toLocaleString()}</b></div></div>
        ${chk && chk[0] === 'flag' ? `<div class="note flag">${chk[1]}</div>` : ''}
        <div class="rows">${G.habits.map((x) => `<div class="row"><span>${esc(x.name)}${x.shared ? ' <span class="lbl" style="font-size:9.5px">· shared</span>' : ''}</span><span class="v">${x.days.length === 6 ? 'Mon–Sat' : x.days.map((w) => DAYS[w]).join(', ')}</span><b class="num">${habitReps(x)}</b></div>`).join('')}</div>
        <div class="vis"><span class="lbl">How it's tracked</span>
          <div><i style="background:var(--c)"></i>Reps: check off each scheduled day. Miss 3 scheduled days in a row and the goal starts slipping.</div>
          <div><i style="background:var(--c)"></i>${G.m.kind === 'count' ? `The count: each Saturday, enter how many ${esc(G.m.unit)} you've done so far.` : `The number: each Saturday, enter your current ${esc(G.m.unit)}.`}</div></div>
        <div class="vis"><span class="lbl">Who sees it</span>
          <div><i style="background:var(--good)"></i>${spouse ? `You and ${esc(spouse.first_name || 'your spouse')}: everything` : 'You, and your spouse once you link accounts'}</div>
          <div><i style="background:${G.area === 'budget' ? 'var(--bad)' : 'var(--good)'}"></i>${G.area === 'budget' ? 'Your crew: nothing. Budget stays at home' : 'Your crew: progress, reps and red flags'}</div></div>
        ${old ? `<div class="note watch">Starting this archives <b>${esc(old.title)}</b>.</div>` : ''}<p class="help" id="err" role="alert" style="color:var(--bad)"></p></div>`; }
    body.innerHTML = h; body.scrollTop = 0; wire(s); preview(); validate();
  }
  const redraw = () => { const y = body.scrollTop; draw(); const cd = $('.card', body); if (cd) cd.style.animation = 'none'; body.scrollTop = y; };
  function mLive() { const el = $('#mLive'); if (!el) return; const m = G.m;
    el.innerHTML = measureOk() ? `<div class="note good">${m.kind === 'count' ? `${num(m.to)} ${esc(m.unit)}, counted from today.` : `${amt(m.from, m.unit)} to ${amt(m.to, m.unit)}: ${num(delta())} ${m.unit === '$' ? 'dollars' : esc(m.unit)} ${m.kind === 'down' ? 'down' : 'up'}.`}</div>`
      : m.kind !== 'count' && m.from !== '' && m.to !== '' && +m.from !== +m.to ? `<div class="note flag">${m.kind === 'down' ? 'The goal should be lower than where you are now.' : 'The goal should be higher than where you are now.'}</div>` : ''; }
  function wire(s) {
    if (s === 'area') $$('.area', body).forEach((b) => (b.onclick = () => { if (G.area !== b.dataset.k) G = blank(b.dataset.k); orb.burst(); redraw(); setTimeout(next, 260); }));
    if (s === 'pick') {
      $$('.tpl', body).forEach((b) => (b.onclick = () => { const k = b.dataset.t;
        if (k === 'custom') { if (G.tpl !== 'custom') G = { ...blank(G.area), tpl: 'custom' }; redraw(); $('#fTitle').focus(); return; }
        const t = TPL[G.area][+k]; G.tpl = +k; G.title = t.t; G.m = { kind: t.kind, unit: t.unit, from: t.from, to: t.to }; G.end = plusMonths(t.months);
        G.habits = t.reps.map(([name, days]) => ({ name, days: [...days], shared: sharedArea() && (G.area === 'budget' || !!spouse) })); orb.burst(); redraw(); setTimeout(next, 260); }));
      const f = $('#fTitle'); if (f) f.oninput = () => { G.title = f.value.trim(); preview(); validate(); };
    }
    if (s === 'measure') {
      $$('.segb', body).forEach((b) => (b.onclick = () => { const k = b.dataset.kind; if (G.m.kind !== k) G.m = { kind: k, unit: G.m.unit, from: k === 'count' ? 0 : G.m.from, to: G.m.to }; redraw(); }));
      $$('[data-u]', body).forEach((b) => (b.onclick = () => { G.m.unit = b.dataset.u; redraw(); }));
      [['fFrom', 'from'], ['fTo', 'to']].forEach(([id, k]) => { const f = $('#' + id); if (f) f.oninput = () => { G.m[k] = f.value === '' ? '' : +f.value; mLive(); preview(); validate(); }; });
      const u = $('#fUnit'); if (u) u.oninput = () => { G.m.unit = u.value.trim(); $$('[data-u]', body).forEach((x) => x.classList.toggle('on', x.dataset.u === G.m.unit)); mLive(); preview(); validate(); };
      mLive();
    }
    if (s === 'end') { $$('[data-end]', body).forEach((b) => (b.onclick = () => { G.end = b.dataset.end; redraw(); })); const f = $('#fEnd'); f.onchange = () => { if (f.value) { G.end = f.value; redraw(); } }; }
    if (s === 'habits') {
      $$('[data-add]', body).forEach((b) => (b.onclick = () => addHabit(b.dataset.add)));
      $$('[data-rm]', body).forEach((b) => (b.onclick = () => { G.habits.splice(+b.dataset.rm, 1); redraw(); }));
      $$('.day:not(:disabled)', body).forEach((b) => (b.onclick = () => { const hb = G.habits[+b.dataset.h], w = +b.dataset.w; hb.days = hb.days.includes(w) ? hb.days.filter((x) => x !== w) : [...hb.days, w].sort(); redraw(); }));
      $$('[data-sh]', body).forEach((b) => (b.onchange = () => { G.habits[+b.dataset.sh].shared = b.checked; redraw(); }));
      const f = $('#fCustom'); if (f) { const add = () => { const t = f.value.trim(); if (t) addHabit(t); }; $('#addC').onclick = add; f.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); add(); } }; }
    }
  }
  function addHabit(name) { if (G.habits.length >= 3 || G.habits.some((h) => h.name === name)) return; G.habits.push({ name, days: [...M], shared: sharedArea() && (G.area === 'budget' || !!spouse) }); orb.burst(); redraw(); }
  function validate() {
    const s = STEPS[step]; let ok = true;
    if (s === 'area') ok = !!G.area;
    if (s === 'pick') ok = G.tpl != null && G.title.length > 2;
    if (s === 'measure') ok = measureOk();
    if (s === 'end') ok = !!G.end && G.end > T0;
    if (s === 'habits') ok = G.habits.length > 0 && G.habits.every((h) => h.days.length) && target() > 0;
    nextBtn.disabled = !ok || busy;
  }
  function next() { if (nextBtn.disabled) return; if (step < STEPS.length - 1) { step++; draw(); } else start(); }
  nextBtn.onclick = next; backBtn.onclick = () => { if (step) { step--; draw(); } };
  const onKey = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && !e.defaultPrevented) { e.preventDefault(); next(); } };
  document.addEventListener('keydown', onKey);

  async function start() {
    busy = true; validate(); nextBtn.textContent = 'Saving…';
    try {
      const old = activeIn(G.area);
      const useHousehold = G.area === 'budget' && household;
      await api.createGoal({ owner_id: useHousehold ? null : state.me.id, household_id: useHousehold ? household.id : null, area: G.area, title: G.title,
        template: typeof G.tpl === 'number' ? TPL[G.area][G.tpl].t : null, measure_kind: G.m.kind, unit: G.m.unit, start_value: G.m.kind === 'count' ? 0 : +G.m.from, goal_value: +G.m.to,
        start_date: T0, end_date: G.end }, G.habits.map((h) => ({ name: h.name, days: h.days, shared: G.area === 'budget' ? !!household : h.shared })));
      if (old) await api.updateGoal(old.id, { status: 'archived' });
      const first = G.habits.some((h) => h.days.includes(toDate(T0).getDay())) ? 'First rep can happen today.' : 'First rep is ' + DAYS[G.habits.flatMap((h) => h.days).sort()[0]] + '.';
      moment({ eye: `${AREAS[G.area].n} · ${guide.name}`, head: 'Goal set.', sub: `${mLine()} by ${fmt(G.end)}`, line: `${esc(G.title)}. <em>${target().toLocaleString()} reps.</em> ${first}`, color: c(), guide: guideKey });
      setTimeout(() => go('/', true), 900);
    } catch (e) { busy = false; nextBtn.textContent = 'Start goal'; validate(); const el = $('#err'); if (el) el.textContent = `Couldn't save: ${e.message}`; else toast(e.message); }
  }

  draw();
  return () => { document.removeEventListener('keydown', onKey); orb.dispose(); };
}
