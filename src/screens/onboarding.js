// Onboarding: one question at a time across nine chapters, a live guide + six dials on the left,
// medical baselines checked as you type, the 119-hour time budget, then a baseline report.
import { api } from '../lib/api.js';
import { state } from '../lib/store.js';
import * as B from '../lib/baseline.js';
import { Orb, GUIDES, orbGradient } from '../ui/orb.js';
import { $, $$, esc, dial, AREA_ORDER, AREAS, squareJpeg, toast } from '../ui/kit.js';

const SAVE_KEY = 'thousand-onboarding';
const SAY = { you: 'Let\'s get your baseline. Honest answers make better numbers.', faith: 'Faith first. Everything else is built on it.', marriage: 'Where things stand at home. Answer as yourself.',
  parenting: 'Time and presence. Not perfection.', health: 'Real numbers against real medical guidelines. Skip what you don\'t know.', sleep: 'Seven hours is the baseline. Let\'s see how close you are.',
  worklife: '168 hours a week. 49 for sleep. 119 to spend on purpose.', money: 'Just where things stand. No account linking.', aim: 'Pick one area to attack first.' };
const FIRST_TO_AREA = { Faith: 'faith', Marriage: 'marriage', Parenting: 'parenting', Health: 'health', 'Work-Life': 'worklife', Budget: 'budget' };

export function render(root, { go }) {
  let A = {}, cur = 'intro:you', done = false, photoBlob = null, orb = null, lastDone = -1, saving = false;
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) ({ A, cur, done } = { A: s.A || {}, cur: s.cur || cur, done: !!s.done }); } catch {}
  const persist = () => { try { const { photo, ...rest } = A; localStorage.setItem(SAVE_KEY, JSON.stringify({ A: rest, cur, done })); } catch {} };

  root.innerHTML = `<div class="flow">
    <aside class="flow-left" id="left">
      <div class="flow-top"><span class="mark">THOUSAND<i></i></span><span id="meAv"></span></div>
      <div class="flow-stage"><canvas id="orb" class="onb-orb" aria-hidden="true"></canvas>
        <div style="display:grid;gap:8px;max-width:420px"><span class="lbl" id="gTag">Your guide</span><p id="gSay" class="onb-say"></p></div></div>
      <div style="display:grid;gap:14px;position:relative;z-index:2">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><b class="disp" style="font-size:24px" id="plantName">Your baseline</b><span class="lbl" id="plantEyebrow"></span></div>
        <div class="onb-dials" id="dials"></div></div>
    </aside>
    <main class="flow-pane">
      <div class="flow-bar"><span class="lbl num" id="counter"></span><div class="bar"><i id="barFill" style="width:0"></i></div><span class="lbl">Setup</span></div>
      <div class="flow-body" id="body"></div>
      <div class="flow-foot"><button class="btn ghost" id="back">Back</button><div style="display:flex;gap:10px;align-items:center"><span class="hint" id="enterHint">Enter ↵</span><button class="btn" id="skip" hidden>Skip</button><button class="btn primary" id="next">Continue</button></div></div>
    </main></div>`;
  const body = $('#body'), nextBtn = $('#next'), skipBtn = $('#skip'), backBtn = $('#back');
  orb = Orb.make($('#orb'), A.guide || 'ember', { detail: 48 });

  const steps = () => { const out = []; B.CH.forEach((c) => { out.push('intro:' + c.id); B.Q.filter((q) => q.ch === c.id && (!q.when || q.when(A))).forEach((q) => out.push(q.id)); }); return out; };
  const qOf = (id) => B.Q.find((q) => q.id === id);
  const answered = (id) => A[id] !== undefined && A[id] !== '' && !(Array.isArray(A[id]) && !A[id].length);

  function updateScene() {
    const st = steps(), g = {};
    B.CH.forEach((c) => { if (!c.lane) return; const ids = st.filter((id) => qOf(id)?.ch === c.id);
      const vis = st.indexOf('intro:' + c.id) <= st.indexOf(cur) || done;
      g[c.lane] = g[c.lane] || { n: 0, d: 0, vis: false }; g[c.lane].n += ids.length; g[c.lane].d += ids.filter(answered).length; g[c.lane].vis ||= vis; });
    const G = GUIDES[A.guide || 'ember'];
    $('#left').style.setProperty('--g1', G.colors[0]);
    const chId = cur.startsWith('intro:') ? cur.slice(6) : qOf(cur)?.ch; const c = B.CH.find((x) => x.id === chId) || B.CH[0];
    $('#gTag').textContent = A.guide ? `${G.name} · Your guide` : 'Your guide';
    $('#gSay').textContent = done ? `${A.name ? A.name + ', that' : 'That'}'s your baseline. Now we measure every rep from here.` : SAY[c.id] || '';
    $('#dials').innerHTML = AREA_ORDER.map((l) => { const x = g[l] || { n: 1, d: 0, vis: false }; const f = x.n ? x.d / x.n : 0; const on = x.vis || done;
      return `<div class="onb-dl ${on ? '' : 'off'}"><div class="dial">${dial(on ? f : 0, l, { n: 40, w: 2.8, dome: false })}<div class="mid"><b class="num" style="font-family:var(--f-mono);font-size:11px">${on ? Math.round(f * 100) + '%' : ''}</b></div></div><span>${AREAS[l].n}</span></div>`; }).join('');
    const complete = AREA_ORDER.filter((l) => g[l] && g[l].n && g[l].d === g[l].n).length;
    $('#plantName').textContent = done ? 'Baseline set' : c.lane ? AREAS[c.lane].n : c.id === 'you' ? 'Your baseline' : 'Your first goal';
    $('#plantEyebrow').textContent = `${complete} of 6 areas measured`;
    $('#meAv').innerHTML = A.name ? `<span class="avatar" style="--av:36px">${A.photo ? `<img src="${A.photo}" alt="">` : esc((A.name[0] + (A.last?.[0] || '')).toUpperCase())}</span>` : '';
    if (lastDone >= 0 && complete > lastDone) orb.burst(); orb.setMood(done ? 'celebrate' : 'calm'); lastDone = complete;
  }

  function render() {
    updateScene(); persist();
    const st = steps(), i = st.indexOf(cur), qs = st.filter((id) => qOf(id)), qi = qs.indexOf(cur);
    $('#barFill').style.width = (done ? 100 : (100 * i) / (st.length - 1)) + '%';
    $('#counter').textContent = done ? 'Complete' : qi >= 0 ? `Question ${qi + 1} of ${qs.length}` : 'Chapter';
    backBtn.style.visibility = i > 0 || done ? 'visible' : 'hidden';
    if (done) return renderReport();
    if (cur.startsWith('intro:')) return renderIntro(B.CH.find((c) => 'intro:' + c.id === cur));
    const q = qOf(cur); if (!q) { cur = st[0]; return render(); }
    skipBtn.hidden = !q.optional;
    const sname = esc(A.sname || 'your spouse');
    body.innerHTML = `<div class="card"><div style="display:grid;gap:10px"><span class="lbl">${B.CH.find((c) => c.id === q.ch).title}</span><h2 class="q">${q.q}</h2>
      ${q.help ? `<p class="help">${q.help}</p>` : ''}${q.private ? `<span class="private">${B.LOCK} Private. Your crew never sees this.</span>` : ''}${q.spouseOnly ? `<span class="private">${B.LOCK} Shared only with ${sname}. Never with the crew.</span>` : ''}${q.ch === 'marriage' && B.married(A) && !q.spouseOnly && q.id !== 'sname' && q.id !== 'spouse' ? `<span class="private">Shown side by side with ${sname}'s answer</span>` : ''}</div>
      ${inputHTML(q)}<div id="live"></div></div>`;
    body.scrollTop = 0; wire(q); live(q); validate(q);
  }
  function renderIntro(c) {
    skipBtn.hidden = true;
    const qn = steps().filter((id) => qOf(id)?.ch === c.id).length;
    body.innerHTML = `<div class="card"><span class="lbl">Chapter ${B.CH.indexOf(c) + 1} of ${B.CH.length} · ${qn} questions</span>
      <h2 class="chapter-title disp metal">${c.id === 'you' ? 'Set your baseline' : c.title}</h2>
      <p class="help" style="font-size:16px;color:var(--fg)">${c.id === 'you' ? 'Six areas. Faith, marriage, parenting, health, work-life and money. Answer honestly and we\'ll set your baseline, then measure every rep from here.' : c.blurb}</p>
      <p class="verse"><em>“${c.verse[0]}”</em> ${c.verse[1]}</p>${c.id === 'you' ? '<p class="help">About 10 minutes. Anything marked private stays between you and God.</p>' : ''}</div>`;
    nextBtn.disabled = false; nextBtn.textContent = c.id === 'you' ? 'Begin' : 'Continue';
  }
  const maxBday = () => { const d = new Date(); return `${d.getFullYear() - 18}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function inputHTML(q) {
    const v = A[q.id];
    switch (q.type) {
      case 'photo': return `<div class="photo"><label class="pic" for="f-photo">${A.photo ? `<img src="${A.photo}" alt="Your profile photo">` : `<span>${esc(((A.name || '?')[0] + (A.last?.[0] || '')).toUpperCase())}</span>`}</label>
        <div style="display:grid;gap:8px;justify-items:start"><label class="btn" for="f-photo">${A.photo ? 'Change photo' : 'Choose photo'}</label>${A.photo ? '<button class="btn ghost" id="rmPhoto">Remove</button>' : ''}<span class="help" style="font-size:12.5px">We crop it to a circle.</span></div>
        <input id="f-photo" type="file" accept="image/*" hidden></div>`;
      case 'bday': return `<div class="input" style="max-width:300px"><input id="f-bday" type="date" min="1920-01-01" max="${maxBday()}" value="${esc(v || '')}" style="font-size:20px"></div>`;
      case 'tel': return `<div class="input" style="max-width:320px"><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 555-0123" value="${esc(v || '')}"></div>`;
      case 'text': return `<div class="input"><input id="f-${q.id}" type="text" placeholder="${esc(q.ph || '')}" value="${esc(v || '')}" autocomplete="${q.id === 'name' ? 'given-name' : q.id === 'last' ? 'family-name' : 'off'}"></div>`;
      case 'number': return `<div class="input" style="max-width:260px"><input id="f-${q.id}" type="number" inputmode="decimal" min="${q.min}" max="${q.max}" value="${v ?? ''}"><span>${q.unit || ''}</span></div>`;
      case 'choice': return `<div class="opts" role="radiogroup">${q.opts.map((o, k) => `<button class="opt ${v === o ? 'on' : ''}" role="radio" aria-checked="${v === o}" data-v="${esc(o)}"><kbd>${k < 9 ? k + 1 : ''}</kbd>${o}</button>`).join('')}</div>`;
      case 'multi': return `<div class="opts">${q.opts.map((o) => `<button class="opt ${(v || []).includes(o) ? 'on' : ''}" aria-pressed="${(v || []).includes(o)}" data-v="${esc(o)}"><kbd>${(v || []).includes(o) ? '✓' : ''}</kbd>${o}</button>`).join('')}</div>`;
      case 'scale': return `<div class="scale"><div class="scale-row">${Array.from({ length: q.n }, (_, k) => `<button class="opt ${v === k + 1 ? 'on' : ''}" data-v="${k + 1}" aria-label="${k + 1} of ${q.n}">${k + 1}</button>`).join('')}</div><div class="scale-ends"><span>${q.ends[0]}</span><span>${q.ends[1]}</span></div></div>`;
      case 'hw': { const x = v || {}; return `<div class="inrow"><div class="field"><label for="f-ft">Feet</label><div class="input"><input id="f-ft" type="number" inputmode="numeric" min="4" max="7" value="${x.ft ?? ''}"><span>ft</span></div></div><div class="field"><label for="f-in">Inches</label><div class="input"><input id="f-in" type="number" inputmode="numeric" min="0" max="11" value="${x.in ?? ''}"><span>in</span></div></div><div class="field"><label for="f-lb">Weight</label><div class="input"><input id="f-lb" type="number" inputmode="decimal" min="70" max="600" value="${x.lb ?? ''}"><span>lb</span></div></div></div>`; }
      case 'bp': { const x = v || {}; return `<div class="inrow" style="max-width:360px"><div class="field"><label for="f-s">Top number</label><div class="input"><input id="f-s" type="number" inputmode="numeric" value="${x.s ?? ''}"></div></div><div class="field"><label for="f-d">Bottom number</label><div class="input"><input id="f-d" type="number" inputmode="numeric" value="${x.d ?? ''}"></div></div></div>`; }
      case 'labs': { const x = v || {}; const f = (k, l, u) => `<div class="field"><label for="f-${k}">${l}</label><div class="input"><input id="f-${k}" type="number" inputmode="decimal" step="any" value="${x[k] ?? ''}"><span>${u}</span></div></div>`;
        return `<div class="inrow">${f('a1c', 'A1C', '%')}${f('glu', 'Fasting glucose', 'mg/dL')}</div><div class="inrow">${f('tc', 'Total cholesterol', 'mg/dL')}${f('hdl', 'HDL', 'mg/dL')}</div>`; }
      case 'time': if (!v || !('family' in v)) A.time = B.timeDefaults(A); return `<div class="tb" id="tb"></div>`;
      case 'guide': return `<div class="guides" role="radiogroup">${Object.entries(GUIDES).map(([k, g]) => `<button class="gcard ${v === k ? 'on' : ''}" role="radio" aria-checked="${v === k}" data-k="${k}"><span class="ball" style="background:${orbGradient(k)}"></span><span><b>${g.name}</b><span class="lbl">${g.role}</span><em>“${g.sample}”</em></span></button>`).join('')}</div>`;
    }
    return '';
  }
  function wire(q) {
    const opts = $$('.opt', body);
    if (q.type === 'choice') opts.forEach((b) => (b.onclick = () => { A[q.id] = b.dataset.v; refresh(q); setTimeout(next, 260); }));
    if (q.type === 'scale') opts.forEach((b) => (b.onclick = () => { A[q.id] = +b.dataset.v; refresh(q); setTimeout(next, 260); }));
    if (q.type === 'multi') opts.forEach((b) => (b.onclick = () => { let s = A[q.id] || []; const o = b.dataset.v, excl = ['Nothing major right now', 'Debt-free'];
      s = s.includes(o) ? s.filter((x) => x !== o) : excl.includes(o) ? [o] : [...s.filter((x) => !excl.includes(x)), o]; A[q.id] = s; refresh(q); }));
    if (q.type === 'photo') {
      $('#f-photo').onchange = async (e) => { const file = e.target.files?.[0]; if (!file) return;
        try { photoBlob = await squareJpeg(file); A.photo = URL.createObjectURL(photoBlob); A.photoSet = true; rerender(); } catch (err) { toast(err.message); } };
      const rm = $('#rmPhoto'); if (rm) rm.onclick = () => { photoBlob = null; delete A.photo; A.photoSet = false; rerender(); };
    }
    if (q.type === 'bday') { const f = $('#f-bday'); f.oninput = f.onchange = () => { A.bday = f.value; validate(q); live(q); }; }
    if (q.type === 'tel') { const f = $('#f-phone'); f.focus(); f.oninput = () => { A.phone = f.value; validate(q); }; f.onblur = () => { f.value = A.phone = B.fmtPhone(f.value); persist(); }; }
    if (q.type === 'text' || q.type === 'number') { const f = $('#f-' + q.id); f.focus(); f.oninput = () => { A[q.id] = q.type === 'number' ? (f.value === '' ? '' : +f.value) : f.value.trim(); validate(q); live(q); updateScene(); }; }
    const multiField = (key, ks) => ks.forEach((k) => { $('#f-' + k).oninput = (e) => { A[key] = { ...(A[key] || {}), [k]: e.target.value === '' ? '' : +e.target.value }; validate(q); live(q); }; });
    if (q.type === 'hw') { multiField('hw', ['ft', 'in', 'lb']); $('#f-ft').focus(); }
    if (q.type === 'bp') { multiField('bp', ['s', 'd']); $('#f-s').focus(); }
    if (q.type === 'labs') multiField('labs', ['a1c', 'glu', 'tc', 'hdl']);
    if (q.type === 'guide') $$('.gcard', body).forEach((b) => (b.onclick = () => { A.guide = b.dataset.k; orb.setGuide(A.guide);
      $$('.gcard', body).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); validate(q); updateScene(); persist(); }));
    if (q.type === 'time') renderTime();
  }
  const rerender = () => { const y = body.scrollTop; render(); const c = $('.card', body); if (c) c.style.animation = 'none'; body.scrollTop = y; };
  function refresh(q) { const wrap = $('.opts,.scale', body); const tmp = document.createElement('div'); tmp.innerHTML = inputHTML(q); wrap.replaceWith(tmp.firstElementChild); wire(q); validate(q); live(q); updateScene(); }
  function validate(q) {
    const v = A[q.id]; let ok = true;
    if (q.type === 'text') ok = !!v;
    if (q.type === 'photo') ok = !!A.photo;
    if (q.type === 'bday') { const a = B.ageOn(v); ok = !!v && a >= 18 && a < 110; }
    if (q.type === 'tel') ok = B.digits(v).length >= 10;
    if (q.type === 'number') ok = v !== '' && v != null && v >= q.min && v <= q.max;
    if (q.type === 'choice' || q.type === 'scale') ok = v != null;
    if (q.type === 'multi') ok = !!(v && v.length);
    if (q.type === 'hw') ok = !!(v && v.ft >= 4 && v.ft <= 7 && v.lb >= 70);
    if (q.type === 'bp') ok = !!(v && v.s >= 70 && v.d >= 40);
    if (q.type === 'guide') ok = !!v;
    nextBtn.disabled = !ok; nextBtn.textContent = 'Continue';
    return ok;
  }
  const bl = (r) => r ? `<div class="note ${r.st}"><b>${r.label} ${esc(r.v)}</b>${r.note ? ' · ' + r.note : ''} <span style="color:var(--mut)">· Healthy: ${r.range}</span><small>${r.src}</small></div>` : '';
  function live(q) {
    const L = $('#live'); if (!L) return; let h = '';
    if (q.id === 'bday' && A.bday) { const a = B.ageOn(A.bday); h = a < 18 ? `<div class="note flag"><b>THOUSAND is for adults 18 and up.</b></div>` : `<p class="help">You're ${a}.</p>`; }
    if (q.id === 'hw') { const r = B.evalBMI(A.hw); h = bl(r) + (r ? '<p class="help" style="font-size:12.5px">BMI doesn\'t account for muscle. Waist size, next, fills in the picture.</p>' : ''); }
    if (q.id === 'waist') h = bl(B.evalWaist(A.waist, A.sex));
    if (q.id === 'rhr') h = bl(B.evalRHR(A.rhr));
    if (q.id === 'bp') { const r = B.evalBP(A.bp); h = bl(r); if (r && /crisis/.test(r.note)) h += `<div class="note flag"><b>A reading above 180/120 needs medical attention today.</b> If you have chest pain, shortness of breath or vision changes, call 911.</div>`; }
    if (q.id === 'labs') h = B.evalLabs(A.labs, A.sex).map(bl).join('');
    if ((q.id === 'lift' || q.id === 'cardio') && A.lift && A.cardio) h = bl(B.evalCardio(A.cardio, A.lift));
    if (q.id === 'alcohol') h = bl(B.evalAlcohol(A.alcohol, A.sex));
    if (q.id === 'sleep') h = bl(B.evalSleep(A.sleep));
    if (q.id === 'snore' && A.snore === 'Yes') h = `<div class="note watch"><b>Worth asking a doctor about.</b> Loud snoring or pauses in breathing can be signs of sleep apnea, which is common and very treatable.<small>STOP-BANG sleep apnea screening</small></div>`;
    if (q.id === 'produce') h = bl(B.evalProduce(A.produce));
    if (q.id === 'steps') h = bl(B.evalSteps(A.steps));
    L.innerHTML = h ? `<div style="display:grid;gap:8px">${h}</div>` : '';
  }
  function renderTime() {
    const T = A.time, used = Object.values(T).reduce((a, b) => a + b, 0), left = 119 - used;
    const sm = B.SLEEPMID[A.sleep], debt = sm && sm < 7 ? Math.round((7 - sm) * 7) : 0;
    $('#tb').innerHTML = `<div class="tb-total"><div><span class="lbl">${left >= 0 ? 'Unbudgeted' : 'Over budget'}</span><br><b class="num disp ${left < 0 ? 'over' : ''}">${Math.abs(left)} <span style="font-size:20px;color:var(--mut)">hrs</span></b></div>
        <div style="text-align:right"><span class="lbl">168 − 49 sleep</span><br><b class="num disp" style="font-size:28px">119</b></div></div>
      <div class="donut">${B.donut(T)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="help" style="font-size:12.5px">Starting point: a full-time worker with a spouse and 4 kids, adjusted to your answers.</span><button class="btn small" id="tbReset">Reset to my defaults</button></div>
      ${left < 0 ? `<div class="note flag"><b>You're ${-left} hours over.</b> Those hours come out of sleep. Something has to give.<small>Baseline: 7 hours of sleep a night</small></div>` : ''}
      ${debt ? `<div class="note watch"><b>You told us you sleep about ${sm} hours.</b> That's roughly ${debt} hours a week already borrowed from sleep. We still budget against 119, because 7 is the baseline.<small>${B.SRC.aasm}</small></div>` : ''}
      <div class="tb-rows">${B.TCATS.map((c) => `<div class="tb-row"><span class="sw" style="background:${c.c}"></span><span class="nm">${c.n}<small>${c.sub}</small></span>
        <span class="step"><button data-k="${c.k}" data-d="-1" aria-label="Less ${c.n}">−</button><output class="num">${T[c.k]}</output><span class="pct num">${Math.round((T[c.k] / 119) * 100)}%</span><button data-k="${c.k}" data-d="1" aria-label="More ${c.n}">+</button></span></div>`).join('')}</div>`;
    $('#tbReset').onclick = () => { A.time = B.timeDefaults(A); renderTime(); persist(); };
    $$('#tb .step button').forEach((b) => (b.onclick = () => { T[b.dataset.k] = Math.max(0, T[b.dataset.k] + +b.dataset.d); renderTime(); persist(); }));
  }

  function next() {
    if (nextBtn.disabled) return;
    const st = steps(), i = st.indexOf(cur);
    if (i >= st.length - 1) { done = true; render(); return; }
    cur = st[i + 1]; render();
  }
  function back() {
    if (done) { done = false; nextBtn.onclick = next; render(); return; }
    const st = steps(), i = st.indexOf(cur); if (i > 0) { cur = st[i - 1]; render(); }
  }
  nextBtn.onclick = next; backBtn.onclick = back;
  skipBtn.onclick = () => { const q = qOf(cur); if (A[q.id] == null || A[q.id] === '') A[q.id] = { skipped: true }; nextBtn.disabled = false; next(); };
  const onKey = (e) => {
    if (done || saving) return;
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); next(); return; }
    const q = qOf(cur); if (!q || e.target.tagName === 'INPUT') return;
    const n = +e.key; if (q.type === 'choice' && n >= 1 && n <= q.opts.length) { A[q.id] = q.opts[n - 1]; refresh(q); setTimeout(next, 260); }
  };
  document.addEventListener('keydown', onKey);

  function renderReport() {
    skipBtn.hidden = true; nextBtn.disabled = false; nextBtn.textContent = 'Save and set my first goal'; nextBtn.onclick = finish;
    const age = B.ageOn(A.bday);
    const health = [B.evalBMI(A.hw), B.evalWaist(A.waist, A.sex), B.evalBP(A.bp), B.evalRHR(A.rhr), ...B.evalLabs(A.labs, A.sex), B.evalCardio(A.cardio, A.lift), B.evalSteps(A.steps), B.evalProduce(A.produce), B.evalAlcohol(A.alcohol, A.sex), B.evalSleep(A.sleep)].filter(Boolean);
    if (A.nicotine && A.nicotine !== 'None') health.push({ label: 'Nicotine', v: A.nicotine, range: 'None', st: 'flag', note: '', src: 'CDC' });
    if (A.physical && A.physical !== 'Within a year') health.push({ label: 'Last physical', v: A.physical, range: 'Yearly', st: 'watch', note: 'Book one. You\'ll get real numbers for the blanks.', src: 'USPSTF preventive care' });
    const mind = B.evalMind(A);
    const row = (r) => `<div class="rrow"><span>${r.label}${r.private ? ' ' + B.LOCK : ''}</span><span class="v">${esc(r.v)}</span><span class="rpill ${r.st}">${r.st === 'good' ? 'On baseline' : r.st === 'watch' ? 'Watch' : 'Flag'}</span><span class="r">Healthy: ${r.range}${r.note ? ' · ' + r.note : ''}</span></div>`;
    const faith = [
      { label: 'Scripture', v: (A.bible || '?') + ' days/wk', range: 'Daily', st: A.bible === 'Every day' ? 'good' : ['3–4', '5–6'].includes(A.bible) ? 'watch' : 'flag', note: '' },
      { label: 'Prayer', v: A.prayer || '?', range: 'Daily', st: ['Daily', 'All through the day'].includes(A.prayer) ? 'good' : A.prayer === 'A few times a week' ? 'watch' : 'flag', note: '' },
      { label: 'Church', v: A.church || '?', range: 'Weekly', st: /Every week/.test(A.church || '') ? 'good' : A.church === '2–3 times a month' ? 'watch' : 'flag', note: '' },
      { label: 'Accountability', v: A.group || '?', range: 'Regular', st: A.group === 'Yes, regularly' ? 'good' : 'watch', note: '' }];
    const T = A.time && 'family' in A.time ? A.time : B.timeDefaults(A), used = Object.values(T).reduce((a, b) => a + b, 0);
    const flags = [...health, ...mind, ...faith].filter((r) => r.st === 'flag').length;
    const first = FIRST_TO_AREA[A.first] || 'faith';
    body.innerHTML = `<div class="card report">
      <div style="display:grid;gap:10px">${A.photo ? `<img src="${A.photo}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover">` : ''}<span class="lbl">${esc([A.name, A.last].filter(Boolean).join(' '))} · Baseline report</span>
        <h2 class="chapter-title disp metal" style="font-size:clamp(40px,6vw,60px)">${A.name ? esc(A.name) + ', here\'s' : 'Here\'s'} your baseline.</h2>
        <p class="help" style="font-size:15.5px;color:var(--fg)">This is where you're starting. ${flags ? `${flags} thing${flags > 1 ? 's' : ''} need attention. That's not a grade. It's a map.` : 'A strong start.'}</p></div>
      ${mind.some((r) => r.st === 'flag') ? `<div class="note flag"><b>Your answers suggest you've been carrying a lot.</b> Please talk to a doctor, counselor or pastor this week. If you ever feel unsafe, call or text 988 (Suicide & Crisis Lifeline, US). This stays private.</div>` : ''}
      <div class="note good"><b>Next: your first goal.</b> You picked ${AREAS[first].n}. We'll set the measure, the date and your daily reps.</div>
      <div class="rsec"><h3 class="disp">Health <span class="lbl">${age ? 'Age ' + age + ' · ' : ''}${esc(A.sex || '')}</span></h3>${health.length ? health.map(row).join('') : '<p class="help">No health numbers yet.</p>'}${mind.map(row).join('')}</div>
      <div class="rsec"><h3 class="disp">Faith</h3>${faith.map(row).join('')}</div>
      <div class="rsec"><h3 class="disp">Time <span class="lbl num">${used} of 119 hrs</span></h3>
        <div class="time-sum"><div class="donut" style="max-width:180px">${B.donut(T)}</div><div style="display:grid;gap:6px;font-size:13px">${B.TCATS.filter((c) => T[c.k]).map((c) => `<span style="display:flex;gap:8px;align-items:center"><i style="width:10px;height:10px;border-radius:50%;background:${c.c};flex:none"></i><span style="flex:1">${c.n}</span><span class="num" style="font-family:var(--f-mono);color:var(--mut)">${T[c.k]}h · ${Math.round((T[c.k] / 119) * 100)}%</span></span>`).join('')}</div></div></div>
      <p class="help" style="font-size:12px">Health baselines come from the published guidelines named on each row. This is a starting point for conversation, not a diagnosis. Talk to your doctor about anything flagged.</p>
      <p class="help" id="saveErr" role="alert" style="color:var(--bad)"></p></div>`;
    body.scrollTop = 0; updateScene();
  }

  async function finish() {
    if (saving) return; saving = true; nextBtn.disabled = true; nextBtn.textContent = 'Saving…'; $('#saveErr').textContent = '';
    try {
      let photo_url = state.me?.photo_url || null;
      if (photoBlob) photo_url = await api.uploadPhoto(photoBlob);
      if (A.photoSet === false) photo_url = null;
      const { photo, photoSet, ...answers } = A;
      await api.saveBaseline({ birthday: A.bday, sex: A.sex, answers, time_budget: A.time || {} });
      if (B.married(A)) await api.saveMarriage({ mscore: A.mscore, dates: A.dates, praytog: A.praytog, conflict: A.conflict, intimacy: A.intimacy, years: A.years });
      await api.saveMe({ first_name: A.name, last_name: A.last, phone: B.fmtPhone(A.phone || ''), photo_url, birthday_md: A.bday?.slice(5), guide: A.guide || 'ember', onboarded: true });
      try { localStorage.removeItem(SAVE_KEY); } catch {}
      go(`/goals/new?area=${FIRST_TO_AREA[A.first] || 'faith'}&first=1`, true);
    } catch (e) {
      saving = false; nextBtn.disabled = false; nextBtn.textContent = 'Save and set my first goal';
      $('#saveErr').textContent = `Couldn't save: ${e.message}. Check your connection and try again.`;
    }
  }

  render();
  return () => { document.removeEventListener('keydown', onKey); orb.dispose(); };
}
