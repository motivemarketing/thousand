// Today: the daily rep ring, your guide, your goals, and the selected goal in detail.
import { api } from '../lib/api.js';
import { state, myGoals, setRep, loggedToday, recompute, loadAll, crewGoalsOf } from '../lib/store.js';
import { todayISO, addDays, toDate, crossedMilestone, measureProgress, MILESTONES, target } from '../lib/rules.js';
import { repIdeas, repDays } from '../lib/templates.js';
import { memberRow, crewPeople } from './crew.js';
import { Orb, GUIDES, orbGradient, $, $$, esc, dial, AREAS, AREA_ORDER, DAYS, SHORT, num, amt, fmtDate, measureLine, moment, toast } from '../ui/kit.js';

const VERSES = {
  faith: ['And let us not grow weary of doing good, for in due season we will reap, if we do not give up.', 'Galatians 6:9'],
  marriage: ['A threefold cord is not quickly broken.', 'Ecclesiastes 4:12'],
  parenting: ['Train up a child in the way he should go; even when he is old he will not depart from it.', 'Proverbs 22:6'],
  health: ['I discipline my body and keep it under control.', '1 Corinthians 9:27'],
  worklife: ['It is in vain that you rise up early and go late to rest, eating the bread of anxious toil; for he gives to his beloved sleep.', 'Psalm 127:2'],
  budget: ['The plans of the diligent lead surely to abundance, but everyone who is hasty comes only to poverty.', 'Proverbs 21:5'],
};
const VOICE = {
  ember: { slip: (a, n, lost, h) => `${a} has gone ${n} days. That's ${lost} reps gone. <em>Log “${h}” today</em> and stop the bleeding.`, behind: (a, x, h) => `${a} is ${x} reps behind. Not a crisis. A to-do. <em>“${h}” today.</em>`, done: () => 'Every rep. <em>Done.</em> Same spot tomorrow.', left: (n) => `${n} reps left. <em>Go get them.</em>`, rest: () => 'Sabbath. <em>Rest is part of the plan.</em>' },
  selah: { slip: (a, n, lost, h) => `It's been ${n} days in ${a}. Grace covers it, and today is new. <em>Start with “${h}.”</em>`, behind: (a, x, h) => `${a} is ${x} behind. Small faithfulness adds up. <em>“${h}” is enough for today.</em>`, done: () => 'Well done. <em>Rest tonight.</em> He gives to his beloved sleep.', left: (n) => `${n} reps left today. <em>One faithful step at a time.</em>`, rest: () => 'Be still, and know. <em>No reps today.</em>' },
  atlas: { slip: (a, n, lost, h, k) => `${a}: ${n} days missed, ${lost} reps lost, −${k} a day until you log. <em>One rep resets the decay.</em>`, behind: (a, x, h, d) => `${a} is ${x} behind with ${d} days left. <em>${(x / Math.max(1, d)).toFixed(1)} extra reps a day</em> closes it.`, done: () => '100% today. <em>Pace holds.</em>', left: (n, d, t) => `${d} of ${t} today. <em>${n} remaining.</em>`, rest: () => 'Sunday. <em>0 reps scheduled.</em> Pace unaffected.' },
  tide: { slip: (a, n, lost, h) => `${a} slipped a little. That's okay. <em>One rep today turns it around.</em> Try “${h}.”`, behind: (a, x, h, d) => `${a} is a bit behind, and you've got ${d} days. <em>“${h}” today</em> is a good start.`, done: () => 'You did every rep today. <em>Take that in.</em>', left: (n) => `${n} left today. <em>One at a time.</em>`, rest: () => 'It\'s Sunday. <em>Breathe. Rest.</em>' },
  volt: { slip: (a, n, lost, h) => `${a} has gone cold. ${n} days! <em>Light it back up: “${h},” right now.</em>`, behind: (a, x, h) => `${a}: ${x} behind. <em>Take a bite out of it today.</em> “${h}.” Go.`, done: () => 'Clean sweep. <em>Every rep.</em> Run it back tomorrow.', left: (n) => `${n} reps on the board. <em>Let's clear it.</em>`, rest: () => 'Rest day. <em>Recharge.</em> Big week ahead.' },
};
const MOMENT_VOICE = {
  ember: { milestone: (a, l) => `${l} on ${a}. <em>Don't celebrate long.</em> Same spot tomorrow.`, complete: (a) => `${a}: done. You said you would, and you did. <em>Pick the next one.</em>`, sweep: () => 'Every rep today. <em>That\'s the standard.</em>' },
  selah: { milestone: (a, l) => `${l} on ${a}. <em>Faithful in little.</em> Keep going.`, complete: (a) => `${a} is finished. <em>Well done, good and faithful servant.</em> Give thanks, then rest.`, sweep: () => 'Every rep, every area. <em>Rest tonight.</em>' },
  atlas: { milestone: (a, l) => `${a} crossed ${l.toLowerCase()}. <em>On this pace you finish on schedule.</em>`, complete: (a) => `${a}: 100%. <em>Target met.</em> Set the next one while momentum is high.`, sweep: () => '<em>100% completion today.</em>' },
  tide: { milestone: (a, l) => `${l} on ${a}. <em>Look how far you've come.</em>`, complete: (a) => `You finished ${a}. <em>Take a minute with that.</em> You earned it.`, sweep: () => 'Every rep today. <em>Be proud of that.</em>' },
  volt: { milestone: (a, l) => `${l.toUpperCase()} on ${a}! <em>Keep swinging.</em>`, complete: (a) => `${a}: DONE! <em>Let's go!</em> What's next?`, sweep: () => 'CLEAN SWEEP! <em>Every single rep.</em> Run it back tomorrow.' },
};

export function render(root, { go, params }) {
  const today = todayISO(), weekday = toDate(today).getDay();
  const guideKey = state.me.guide || 'ember', G = GUIDES[guideKey];
  let sel = params.goal || null, orb = null, logDay = today, editing = null, draft = [];

  const goals = () => myGoals().sort((a, b) => AREA_ORDER.indexOf(a.area) - AREA_ORDER.indexOf(b.area));
  const dueOn = (g, day) => { const w = toDate(day).getDay(); return g.status === 'active' && day >= g.start_date && day <= g.end_date ? g.habits.filter((h) => w !== 0 && h.days.includes(w) && (!h.active_from || day >= h.active_from) && (!h.active_until || day <= h.active_until)) : []; };
  const dueToday = () => goals().flatMap((g) => dueOn(g, today).map((h) => ({ g, h })));

  root.innerHTML = `<section class="hero"><div class="panel today" id="ring"></div>
      <div class="panel guide-p" id="guide"><div class="guide-top"><canvas class="orb3d" id="orb" aria-hidden="true"></canvas>
        <div><span class="lbl">Your guide</span><b class="disp metal" style="display:block;font-size:34px">${G.name}</b><span class="lbl">${G.role}</span></div></div>
        <p id="gLine" class="g-line"></p><div class="stat-row" id="gStats"></div></div></section>
    <div id="checkin"></div>
    <section class="goals" id="goals"></section>
    <section class="panel detail" id="detail" aria-live="polite"></section>
    <section class="panel" id="crewToday"></section>`;
  orb = Orb.make($('#orb'), guideKey, { detail: 44 });

  function line() {
    const V = VOICE[guideKey], gs = goals().filter((g) => g.status === 'active');
    if (weekday === 0) return V.rest();
    const slip = gs.find((g) => g.ev.slipping), behind = gs.filter((g) => g.ev.pace < 0).sort((a, b) => a.ev.pace - b.ev.pace)[0];
    const d = dueToday(), left = d.filter(({ h }) => !loggedToday(h.id)).length;
    const nm = (g) => AREAS[g.area].n;
    if (slip) return V.slip(nm(slip), slip.ev.missed, slip.ev.lost, esc(slip.habits[0].name), slip.habits.length);
    if (behind) return V.behind(nm(behind), -behind.ev.pace, esc((behind.habits.find((h) => !loggedToday(h.id)) || behind.habits[0]).name), behind.ev.daysLeft);
    if (!d.length) { const nx = gs.map((g) => nextDue(g)).filter((x) => x !== 'none this week')[0]; return `Nothing scheduled today. <em>Next rep: ${nx || 'next week'}.</em>`; }
    if (d.length && !left) return V.done();
    return V.left(left, d.length - left, d.length);
  }
  function drawRing() {
    const d = dueToday(), done = d.filter(({ h }) => loggedToday(h.id)).length, total = d.length;
    const c = 50, r = 42, gap = total > 1 ? 0.06 : 0, w = 7.5; let arcs = '';
    d.forEach(({ g, h }, k) => { const a0 = (k / total) * Math.PI * 2 - Math.PI / 2 + gap / 2, a1 = ((k + 1) / total) * Math.PI * 2 - Math.PI / 2 - gap / 2;
      const p = (a) => `${(c + Math.cos(a) * r).toFixed(2)},${(c + Math.sin(a) * r).toFixed(2)}`; const on = loggedToday(h.id);
      arcs += `<path d="M${p(a0)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}" ${on ? 'filter="url(#glow)"' : ''} style="fill:none;stroke:${on ? `url(#gr-${g.area})` : 'var(--track)'};stroke-width:${w};stroke-linecap:round"/>`; });
    const chips = goals().filter((g) => dueOn(g, today).length).map((g) => { const hs = dueOn(g, today), n = hs.filter((h) => loggedToday(h.id)).length;
      return `<span class="chip-s ${n === hs.length ? 'done' : ''}" style="--c:var(--${g.area})"><i class="dot"></i>${AREAS[g.area].n} ${n}/${hs.length}</span>`; }).join('');
    const dateLbl = toDate(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    $('#ring').innerHTML = `<div class="ringwrap"><svg viewBox="0 0 100 100" aria-label="${done} of ${total} reps done today"><circle cx="50" cy="50" r="34" fill="url(#dome)" style="stroke:color-mix(in srgb,var(--fg) 7%,transparent);stroke-width:.5"/>${arcs}</svg>
      <div class="mid"><b class="disp metal num">${weekday === 0 ? '—' : done}</b><span class="lbl">${weekday === 0 ? 'Sabbath' : 'of ' + total}</span></div></div>
      <div style="min-width:0"><span class="lbl">${dateLbl}${state.me.first_name ? ' · ' + esc(state.me.first_name) : ''}</span>
      <h1 class="disp metal hero-h">${weekday === 0 ? 'Sabbath.<br><span>Rest today.</span>' : !goals().length ? 'Set your<br><span>first goal</span>' : !total ? 'Nothing due<br><span>today</span>': total && done === total ? 'Every rep.<br><span>Done.</span>' : `${total - done} rep${total - done === 1 ? '' : 's'}<br><span>left today</span>`}</h1>
      <div class="chips-s">${chips || (!goals().length ? '<a class="btn primary" href="/goals/new" data-link>Set a goal</a>' : '')}</div></div>`;
  }
  function drawGuide() {
    const gs = goals().filter((g) => g.status === 'active');
    const onPace = gs.filter((g) => g.ev.pace >= 0).length, slipping = gs.filter((g) => g.ev.slipping).length;
    const best = gs.reduce((a, g) => (g.ev.streak > (a?.ev.streak ?? -1) ? g : a), null);
    $('#gLine').innerHTML = gs.length ? line() : 'Pick one area and set a goal. <em>Then we hit the same spot every day.</em>';
    $('#gStats').innerHTML = `<div><b class="disp num">${onPace}<small>/${gs.length}</small></b><span class="lbl">On pace</span></div>
      <div><b class="disp num">${best ? best.ev.streak : 0}</b><span class="lbl">Best streak${best ? ' · ' + AREAS[best.area].n : ''}</span></div>
      <div><b class="disp num ${slipping ? 'bad' : ''}">${slipping}</b><span class="lbl">Slipping</span></div>`;
    orb.setMood(slipping ? 'push' : 'calm');
  }
  function drawCheckin() {
    // Weekly number check-in: due Saturdays (and any day after, until logged) for goals with a measure.
    const weekStart = addDays(today, -((weekday + 1) % 7)); // most recent Saturday
    const need = goals().filter((g) => g.status === 'active' && g.measure_kind && (weekday === 6 || today > weekStart) && !(g.latest && g.latest.day >= weekStart) && g.start_date < weekStart);
    const el = $('#checkin');
    if (!need.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<section class="panel checkin"><div class="sec-h"><h2 class="disp">Saturday check-in</h2><span class="lbl">Update your numbers</span></div>
      <div class="ci-rows">${need.map((g) => `<form class="ci" data-g="${g.id}" style="--c:var(--${g.area})"><span class="dot"></span><span class="ci-t"><b>${esc(g.title)}</b><small>${g.measure_kind === 'count' ? `How many ${esc(g.unit)} so far?` : `Current ${esc(g.unit)}`}${g.latest ? ` · last: ${num(g.latest.value)}` : ''}</small></span>
        <span class="input"><input type="number" inputmode="decimal" step="any" required aria-label="${esc(g.title)} current value"></span><button class="btn small" type="submit">Save</button></form>`).join('')}</div></section>`;
    $$('.ci', el).forEach((f) => (f.onsubmit = async (e) => { e.preventDefault(); const v = +$('input', f).value; const g = state.goals.find((x) => x.id === f.dataset.g);
      try { await api.logMeasure(g.id, today, v); state.measures.push({ goal_id: g.id, day: today, value: v }); recompute(); toast('Saved'); drawAll(); } catch (err) { toast(err.message); } }));
  }
  function drawGoals() {
    const el = $('#goals'), gs = goals();
    if (!gs.length) { el.innerHTML = `<div class="panel empty" style="grid-column:1/-1"><h2 class="disp metal" style="font-size:40px;margin:0">No goals yet</h2><p class="help">Start with one area. Measure it, set the date, pick the daily reps.</p><a class="btn primary" href="/goals/new" data-link>Set a goal</a></div>`; return; }
    if (!sel || !gs.some((g) => g.id === sel)) sel = gs[0].id;
    el.innerHTML = gs.map((g) => { const e = g.ev, tag = g.status === 'complete' || e.complete ? '<span class="pill up">Complete</span>' : e.slipping ? `<span class="pill down">Slipping ${e.missed}d</span>` : e.pace >= 0 ? `<span class="pill up">+${e.pace}</span>` : `<span class="pill down">${e.pace}</span>`;
      const hist = e.history.slice(-14);
      return `<button class="goal ${sel === g.id ? 'on' : ''}" data-g="${g.id}" style="--c:var(--${g.area})" aria-label="${esc(AREAS[g.area].n)}: ${e.reps} of ${e.target} reps">
        <div class="dial g-dial">${dial(e.frac, g.area, { n: 48, w: 2.4 })}<div class="mid"><b class="disp metal num" style="font-size:26px">${Math.round(e.frac * 100)}<small>%</small></b></div></div>
        <div class="g-info"><div class="g-area"><span><i class="dot"></i>${AREAS[g.area].n}${g.household_id ? ' <span class="lbl" style="font-size:9.5px">Household</span>' : ''}</span>${tag}</div>
        <span class="g-title">${esc(g.title)}</span><span class="g-reps num">${e.reps.toLocaleString()} / ${e.target.toLocaleString()} reps · ${e.daysLeft}d left</span>
        <div class="spark" aria-hidden="true">${hist.map((d) => `<i style="height:${d.due ? Math.max(8, (d.done / d.due) * 100) : 8}%;opacity:${d.done ? 0.35 + 0.65 * (d.done / Math.max(1, d.due)) : 0.18}"></i>`).join('')}</div></div></button>`; }).join('')
      + `<a class="goal add-goal" href="/goals/new" data-link><span class="disp" style="font-size:28px">+ New goal</span><span class="help">${6 - new Set(gs.map((g) => g.area)).size ? `${6 - new Set(gs.map((g) => g.area)).size} areas without a goal` : 'All six areas have a goal. A new one replaces the current goal in its area.'}</span></a>`;
    $$('.goal[data-g]', el).forEach((b) => { b.onclick = () => { sel = b.dataset.g; drawGoals(); drawDetail(); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }; tilt(b); });
  }
  function drawDetail(bump) {
    const el = $('#detail'), g = goals().find((x) => x.id === sel); if (!g) { el.hidden = true; return; } el.hidden = false;
    const e = g.ev, T = e.target, next = MILESTONES.find(([v]) => e.frac < v), V = VERSES[g.area];
    el.style.setProperty('--c', `var(--${g.area})`);
    const yday = addDays(today, -1), canYday = toDate(yday).getDay() !== 0 && yday >= g.start_date;
    const due = dueOn(g, logDay), mp = measureProgress(g, g.latest?.value);
    const heat = []; const byDay = new Map(e.history.map((d) => [d.day, d]));
    const start = addDays(today, -(7 * 12 - 1) - ((weekday + 6) % 7)); // 12 full weeks, Monday-aligned
    for (let w = 0; w < 12; w++) { const col = []; for (let d = 0; d < 7; d++) { const day = addDays(start, w * 7 + d), x = byDay.get(day); col.push(day > today || day < g.start_date ? 'out' : x && x.due ? x.done / x.due : toDate(day).getDay() === 0 ? 'rest' : null); } heat.push(col); }
    el.innerHTML = `<div class="d-left">
        <div><span class="lbl" style="color:var(--c)">${g.household_id ? `Household goal · ${esc(state.me.first_name || 'You')} + ${esc(state.spouse?.first_name || 'spouse')} · Hidden from crew` : AREAS[g.area].n}</span><h2 class="disp metal d-title">${esc(g.title)}</h2></div>
        <div class="math">${fmtDate(g.start_date)} → ${fmtDate(g.end_date, { month: 'short', day: 'numeric', year: 'numeric' })} · Sundays off · <b>${T.toLocaleString()} reps</b>${g.measure_kind ? ` · ${esc(measureLine(g))}` : ''}</div>
        <div class="dial bigdial">${dial(e.frac, g.area, { n: 96, w: 2.4, r1: 0.4, r2: 0.49 })}<div class="mid"><b class="disp metal num" style="font-size:clamp(60px,8vw,88px)">${e.reps.toLocaleString()}</b><span class="lbl">of ${T.toLocaleString()} reps · ${Math.round(e.frac * 100)}%</span></div><div class="plus" id="plus">+1</div></div>
        <div class="kv"><div><span class="lbl">Pace</span><b class="disp num ${e.pace < 0 ? 'bad' : 'good'}">${e.pace >= 0 ? '+' + e.pace : e.pace}</b><span>${e.pace >= 0 ? 'ahead' : 'behind'}</span></div>
          <div><span class="lbl">Streak</span><b class="disp num">${e.slipping ? 0 : e.streak}</b><span>days</span></div>
          <div><span class="lbl">Left</span><b class="disp num">${Math.max(0, T - e.reps).toLocaleString()}</b><span>reps</span></div>
          <div><span class="lbl">Days</span><b class="disp num">${e.daysLeft}</b><span>remaining</span></div></div></div>
      <div class="d-right">
        ${e.slipping ? `<div class="note flag"><b>Slipping.</b> ${e.missed} scheduled days without a rep has cost ${e.lost} reps. Each missed day costs that day's reps until you log one.</div>` : ''}
        ${editing === g.id ? repEditor(g) : `<div class="reps-list"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="lbl">${logDay === today ? 'Today' : 'Yesterday'} · ${due.filter((h) => loggedToday(h.id, logDay)).length} of ${due.length}</span>
          <span class="chips">${g.status === 'active' ? '<button class="chip" id="editReps">Edit reps</button>' : ''}${canYday ? `<span class="chips"><button class="chip ${logDay === today ? 'on' : ''}" data-day="${today}">Today</button><button class="chip ${logDay === yday ? 'on' : ''}" data-day="${yday}">Yesterday</button>` : ''}</span></div>
          ${toDate(logDay).getDay() === 0 ? '<p class="help">Sunday is the Sabbath. Nothing is scheduled.</p>' : due.length ? due.map((h) => { const on = loggedToday(h.id, logDay);
            return `<label class="rep ${on ? 'done' : ''}"><input type="checkbox" data-h="${h.id}" ${on ? 'checked' : ''} ${g.status !== 'active' ? 'disabled' : ''}><span>${esc(h.name)}${h.shared ? `<small>${g.household_id ? 'Either of you can log it' : `Shared with ${esc(state.spouse?.first_name || 'your spouse')} · one check counts for both`}</small>` : ''}</span><em>${on ? (h.shared ? 'Done together' : 'Done') : '+1 rep'}</em></label>`; }).join('')
            : `<p class="help">Nothing scheduled for this goal ${logDay === today ? 'today' : 'yesterday'}. Next: ${nextDue(g)}.</p>`}</div>`}
        ${g.measure_kind ? `<div class="measure"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span class="lbl">The number</span><span class="lbl">${esc(measureLine(g))}</span></div>
          <div class="m-bar"><i style="width:${(mp ?? 0) * 100}%"></i></div>
          <div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span>${g.latest ? `Now <b class="num">${amt(g.latest.value, g.unit)}</b> · ${fmtDate(g.latest.day)}` : 'No check-in yet'}</span><span class="num">${Math.round((mp ?? 0) * 100)}% of the way</span></div>
          <form class="m-form" id="mForm"><span class="input"><input type="number" step="any" inputmode="decimal" required placeholder="${g.measure_kind === 'count' ? 'Count so far' : 'Current ' + esc(g.unit)}" aria-label="Update the number"></span><button class="btn small" type="submit">Update</button></form></div>` : ''}
        <div style="display:grid;gap:10px"><div style="display:flex;justify-content:space-between"><span class="lbl">Last 12 weeks</span><span class="lbl">${next ? `${Math.max(0, Math.round(next[0] * T) - e.reps)} reps to ${next[1].toLowerCase()}` : 'Complete'}</span></div>
          <div class="heat" role="img" aria-label="Daily completion over the last 12 weeks">${heat.map((col) => `<div class="col">${col.map((v) => `<i class="${v === 'out' ? 'out' : v === 'rest' ? 'rest' : ''}" style="${typeof v === 'number' && v > 0 ? `background:color-mix(in srgb,var(--c) ${Math.round(25 + v * 75)}%,var(--s2))` : ''}"></i>`).join('')}</div>`).join('')}</div></div>
        <div class="miles">${MILESTONES.map(([v, l]) => `<div class="mile ${e.frac >= v ? 'hit' : ''}"><b class="num">${Math.round(v * T).toLocaleString()}</b><span>${l}</span></div>`).join('')}</div>
        <p class="verse"><em>“${V[0]}”</em> ${V[1]}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${e.complete && g.status === 'active' ? '<button class="btn small" id="markDone">Mark complete</button>' : ''}<button class="btn small ghost" id="archive">Archive goal</button></div></div>`;
    if (bump && !matchMedia('(prefers-reduced-motion: reduce)').matches) $('#plus', el).classList.add('go');
    $$('[data-day]', el).forEach((b) => (b.onclick = () => { logDay = b.dataset.day; drawDetail(); }));
    $$('.rep input', el).forEach((inp) => (inp.onchange = () => onRep(g, inp)));
    const er = $('#editReps', el); if (er) er.onclick = () => { editing = g.id; draft = activeReps(g).map((h) => ({ id: h.id, name: h.name, days: [...h.days], shared: h.shared })); drawDetail(); };
    if (editing === g.id) wireEditor(g, el);
    const mf = $('#mForm', el); if (mf) mf.onsubmit = async (ev) => { ev.preventDefault(); const v = +$('input', mf).value;
      try { await api.logMeasure(g.id, today, v); state.measures = state.measures.filter((m) => !(m.goal_id === g.id && m.day === today)); state.measures.push({ goal_id: g.id, day: today, value: v }); recompute(); toast('Number updated'); drawAll(); } catch (err) { toast(err.message); } };
    const arch = $('#archive', el); arch.onclick = async () => {
      if (arch.dataset.confirm !== '1') { arch.dataset.confirm = '1'; arch.textContent = 'Tap again to archive'; arch.classList.add('danger'); return; }
      try { await api.updateGoal(g.id, { status: 'archived' }); g.status = 'archived'; sel = null; toast('Goal archived'); drawAll(); } catch (err) { toast(err.message); } };
    const md = $('#markDone', el); if (md) md.onclick = async () => { try { await api.updateGoal(g.id, { status: 'complete', completed_at: new Date().toISOString() }); g.status = 'complete'; drawAll(); } catch (err) { toast(err.message); } };
  }
  // Edit reps: retire or reschedule reps from today forward. Past days keep the schedule they had.
  const activeReps = (g) => g.habits.filter((h) => !h.active_until || h.active_until >= today);
  const daysText = (d) => (d.length === 6 ? 'Mon–Sat' : d.map((w) => DAYS[w]).join(', '));
  const isShared = (g) => !!g.household_id || g.habits.some((h) => h.shared);
  function draftHabits(g) { // what the habit list will look like after saving
    const keep = g.habits.filter((h) => !activeReps(g).includes(h) || draft.some((x) => x.id === h.id && sameDays(x.days, h.days)));
    const retired = activeReps(g).filter((h) => !keep.includes(h)).map((h) => ({ ...h, active_until: addDays(today, -1) }));
    const added = draft.filter((x) => !x.id || !sameDays(x.days, g.habits.find((h) => h.id === x.id).days)).map((x) => ({ ...x, id: null, active_from: today }));
    return { keep, retired, added, all: [...keep, ...retired, ...added] };
  }
  const sameDays = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  function repEditor(g) {
    const ideas = repIdeas(g.area, g.template || g.title).filter((x) => !draft.some((d) => d.name === x)).slice(0, 6);
    const before = g.ev.target, after = target(g, draftHabits(g).all);
    return `<div class="reps-list rep-edit"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lbl">Edit reps · ${draft.length} of 3</span><span class="lbl num">${before.toLocaleString()} → ${after.toLocaleString()} reps</span></div>
      <p class="help" style="margin:0">Each rep should move ${g.measure_kind ? `<b style="color:var(--fg)">${esc(measureLine(g))}</b>` : 'this goal'}. If you did every rep on its days, you'd hit it. Changes count from today, and past days keep their old schedule.</p>
      ${draft.map((x, i) => `<div class="habit"><div class="habit-top"><b>${esc(x.name)}</b>${draft.length > 1 ? `<button class="x" data-rm="${i}" aria-label="Remove ${esc(x.name)}">Remove</button>` : ''}</div>
        <div class="days" role="group" aria-label="Days for ${esc(x.name)}">${[1, 2, 3, 4, 5, 6, 0].map((w) => `<button class="day ${x.days.includes(w) ? 'on' : ''}" data-i="${i}" data-w="${w}" ${w === 0 ? 'disabled aria-label="Sunday, Sabbath"' : `aria-pressed="${x.days.includes(w)}" aria-label="${DAYS[w]}"`}>${SHORT[w]}</button>`).join('')}</div>
        <div class="habit-foot"><span>${x.days.length ? daysText(x.days) : 'Pick at least one day'}</span></div></div>`).join('')}
      ${draft.length < 3 ? `<div style="display:grid;gap:10px"><span class="lbl">Add a rep</span>${ideas.length ? `<div class="chips">${ideas.map((x) => `<button class="chip" data-add="${esc(x)}">+ ${esc(x)}</button>`).join('')}</div>` : ''}
        <div style="display:flex;gap:8px"><span class="input" style="flex:1"><input id="repCustom" type="text" maxlength="60" placeholder="Or write your own" aria-label="Write your own rep"></span><button class="btn small" id="repAdd">Add</button></div></div>` : ''}
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn small ghost" id="repCancel">Cancel</button><button class="btn small primary" id="repSave" ${draft.every((x) => x.days.length) ? '' : 'disabled'}>Save reps</button></div></div>`;
  }
  function wireEditor(g, el) {
    const add = (name) => { if (draft.length >= 3 || !name || draft.some((d) => d.name.toLowerCase() === name.toLowerCase())) return; draft.push({ name, days: repDays(g.area, name), shared: isShared(g) }); drawDetail(); };
    $$('[data-add]', el).forEach((b) => (b.onclick = () => add(b.dataset.add)));
    $$('[data-rm]', el).forEach((b) => (b.onclick = () => { draft.splice(+b.dataset.rm, 1); drawDetail(); }));
    $$('.rep-edit .day:not(:disabled)', el).forEach((b) => (b.onclick = () => { const x = draft[+b.dataset.i], w = +b.dataset.w; x.days = x.days.includes(w) ? x.days.filter((d) => d !== w) : [...x.days, w].sort(); drawDetail(); }));
    const c = $('#repCustom', el); if (c) { const go = () => add(c.value.trim()); $('#repAdd', el).onclick = go; c.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; }
    $('#repCancel', el).onclick = () => { editing = null; drawDetail(); };
    $('#repSave', el).onclick = async (e) => { e.target.disabled = true;
      const { retired, added } = draftHabits(g), pos = Math.max(0, ...g.habits.map((h) => h.position || 0)) + 1;
      try {
        await api.editHabits(g.id, { retire: retired.map((h) => h.id), add: added.map((x, i) => ({ name: x.name, days: x.days, shared: x.shared, position: pos + i })) }, today, addDays(today, -1));
        await loadAll(); editing = null; toast('Reps updated'); drawAll();
      } catch (err) { toast(err.message); e.target.disabled = false; } };
  }
  const nextDue = (g) => { for (let i = 1; i < 8; i++) { const d = addDays(today, i); if (dueOn(g, d).length) return DAYS[toDate(d).getDay()]; } return 'none this week'; };

  async function onRep(g, inp) {
    const h = g.habits.find((x) => x.id === inp.dataset.h), before = g.ev.reps;
    const totalBefore = dueToday().filter(({ h: x }) => loggedToday(x.id)).length;
    try { await setRep(h, g, inp.checked, logDay); } catch (e) { toast(e.message); drawAll(); return; }
    drawAll(inp.checked);
    if (!inp.checked) return;
    orb.burst();
    const gg = state.goals.find((x) => x.id === g.id), after = gg.ev.reps, crossed = crossedMilestone(before, after, gg.ev.target), MV = MOMENT_VOICE[guideKey], a = AREAS[g.area].n;
    const d = dueToday(), totalNow = d.filter(({ h: x }) => loggedToday(x.id)).length;
    if (crossed && crossed[0] === 1) moment({ eye: `${a} · Goal complete`, head: 'Complete.', sub: `${after.toLocaleString()} of ${gg.ev.target.toLocaleString()} reps`, line: MV.complete(a), color: `var(--${g.area})`, guide: guideKey });
    else if (crossed) moment({ eye: `${a} · ${G.name}`, head: crossed[1] + '.', sub: `${after.toLocaleString()} of ${gg.ev.target.toLocaleString()} reps`, line: MV.milestone(a, crossed[1]), color: `var(--${g.area})`, guide: guideKey });
    else if (logDay === today && d.length && totalNow === d.length && totalBefore < d.length) moment({ eye: `${G.name} · Today`, head: 'Clean sweep.', sub: `${d.length} of ${d.length} reps`, line: MV.sweep(), color: 'var(--acc)', guide: guideKey });
  }
  function drawCrew() {
    const el = $('#crewToday'), people = crewPeople(), flags = people.filter((p) => crewGoalsOf(p.id).some((g) => g.ev.slipping && g.status === 'active')).length;
    el.innerHTML = people.length
      ? `<div class="sec-h"><div><span class="lbl">${flags ? `${flags} ${flags > 1 ? 'need' : 'needs'} a call` : 'No red flags'}</span><h2 class="disp">Your crew</h2></div><a class="btn small" href="/crew" data-link>Open Crew</a></div>${people.map(memberRow).join('')}`
      : `<div class="sec-h"><h2 class="disp">Your crew</h2></div><div class="empty"><p class="help">Nobody's holding you to it yet. Start a crew and send the link to your group text.</p><a class="btn small primary" href="/crew" data-link>Start a crew</a></div>`;
  }
  function drawAll(bump) { drawRing(); drawGuide(); drawCheckin(); drawGoals(); drawDetail(bump); drawCrew(); }

  const canTilt = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tilt(el, max = 5) { if (!canTilt) return;
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * max).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg) translateY(-3px)`; el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%'); });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; }); }

  drawAll();
  return () => orb.dispose();
}
export { orbGradient };
