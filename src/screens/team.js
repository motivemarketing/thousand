// Team: you and your spouse. Spouses see everything, share Marriage reps and one household Budget goal.
import { api } from '../lib/api.js';
import { state, goalsOf, myGoals, loggedToday, setRep } from '../lib/store.js';
import { todayISO, toDate } from '../lib/rules.js';
import { $, $$, esc, dial, avatar, AREAS, AREA_ORDER, fullName, toast, smsLink } from '../ui/kit.js';

const Q = [['mscore', 'How is your marriage?', 'scale'], ['dates', 'Date nights a month'], ['praytog', 'Pray together'], ['conflict', 'When you fight'], ['intimacy', 'Physical intimacy', 'scale']];

export async function render(root, { reload }) {
  const sp = state.spouse, hh = state.household, me = state.me;
  if (!sp) return renderInvite(root, reload);

  const today = todayISO(), w = toDate(today).getDay();
  const spGoals = goalsOf(sp.id), mine = myGoals();
  const myMarriage = mine.find((g) => g.area === 'marriage' && g.owner_id === me.id && g.status === 'active');
  const spMarriage = spGoals.find((g) => g.area === 'marriage' && g.owner_id === sp.id && g.status === 'active');
  const budget = mine.find((g) => g.area === 'budget' && g.household_id && g.status === 'active');
  const sharedToday = [...(myMarriage ? myMarriage.habits.filter((h) => h.shared).map((h) => [h, myMarriage]) : []), ...(budget ? budget.habits.map((h) => [h, budget]) : [])]
    .filter(([h]) => w !== 0 && h.days.includes(w));
  const [myAns, spAns] = await Promise.all([api.getMarriage(me.id).catch(() => null), api.getMarriage(sp.id).catch(() => null)]);
  const flags = spGoals.filter((g) => g.ev.slipping);

  root.innerHTML = `<div class="page-h"><div><span class="lbl">Team</span><h1 class="disp metal">You + ${esc(sp.first_name || 'Spouse')}</h1></div><span class="lbl">Spouses see everything</span></div>
    <section class="panel"><div class="team">
      <div><div class="who-row">${avatar(sp, 48)}<div><b>${esc(fullName(sp))}</b><span class="lbl">${esc(sp.guide ? 'Guide: ' + sp.guide : '')}</span></div>${sp.phone ? `<a class="btn small" href="${smsLink(sp.phone, '')}">Text</a>` : ''}</div>
        <span class="lbl">${esc(sp.first_name || 'Their')}'s goals</span>
        <div class="minirings six">${AREA_ORDER.map((a) => { const g = spGoals.find((x) => x.area === a && x.status !== 'archived'); return mini(g, a, a === 'budget' ? 'Budget · shared' : AREAS[a].n); }).join('')}</div>
        <div style="display:grid;gap:6px">${flags.length ? flags.map((g) => `<div class="flagline">${AREAS[g.area].n} slipping · ${g.ev.missed} days without “${esc(g.habits[0]?.name || '')}”${g.household_id ? '. Either of you can stop it.' : ''}</div>`).join('') : '<div class="flagline ok">No red flags.</div>'}</div></div>
      <div><span class="lbl">Marriage, side by side</span>
        <div class="duo">${duo(myMarriage, 'You')}${duo(spMarriage, esc(sp.first_name || 'Spouse'))}</div>
        <div><span class="lbl">Shared reps today · one check counts for both</span>
          ${w === 0 ? '<p class="help">Sunday. Rest together.</p>' : sharedToday.length ? sharedToday.map(([h, g]) => `<label class="srow"><input type="checkbox" data-h="${h.id}" data-g="${g.id}" ${loggedToday(h.id) ? 'checked' : ''}><span>${esc(h.name)}</span><span class="lbl">${AREAS[g.area].n}</span><span class="dot-s ${loggedToday(h.id) ? 'on' : ''}"><i></i>${loggedToday(h.id) ? 'Done together' : 'Not yet'}</span></label>`).join('')
            : `<p class="help">No shared reps scheduled today. Turn on “Shared with ${esc(sp.first_name || 'your spouse')}” for a Marriage rep, or set a household Budget goal.</p>`}</div></div>
    </div></section>
    <section class="panel"><div class="sec-h"><h2 class="disp">Your answers, side by side</h2><span class="lbl">From onboarding</span></div>
      ${myAns && spAns ? `<div class="side">${Q.map(([k, q, t]) => { const a = myAns[k], b = spAns[k], gap = t === 'scale' ? Math.abs((+a || 0) - (+b || 0)) >= 3 : a !== b, f = (v) => (v == null ? '—' : t === 'scale' ? v + ' / 10' : esc(v));
        return `<div class="srow2"><span>${q}</span><span class="num v">${f(a)} · ${f(b)}</span><span class="pill ${gap ? 'down' : 'up'}">${gap ? 'Talk about it' : 'Aligned'}</span></div>`; }).join('')}</div>`
        : `<div class="empty"><p class="help">${!myAns ? 'You haven\'t answered the marriage questions.' : `${esc(sp.first_name || 'Your spouse')} hasn't answered the marriage questions yet.`} They're part of onboarding.</p></div>`}</section>`;

  $$('.srow input', root).forEach((inp) => (inp.onchange = async () => {
    const g = state.goals.find((x) => x.id === inp.dataset.g), h = g.habits.find((x) => x.id === inp.dataset.h);
    try { await setRep(h, g, inp.checked); toast(inp.checked ? 'Logged for both of you' : 'Removed'); } catch (e) { toast(e.message); }
    render(root, { reload });
  }));
}

function mini(g, area, label) {
  const flag = g?.ev.slipping;
  return `<div class="mr ${flag ? 'flag' : ''} ${g ? '' : 'none'}"><div class="dial">${dial(g ? g.ev.frac : 0, flag ? 'bad' : area, { n: 36, w: 2.8, r1: 0.34, r2: 0.48 })}<div class="mid"><b class="num">${g ? Math.round(g.ev.frac * 100) : '–'}</b></div></div><span>${label}</span></div>`;
}
function duo(g, who) {
  return `<div class="p"><div class="dial">${dial(g ? g.ev.frac : 0, 'marriage', { n: 60, w: 2.4 })}<div class="mid"><b class="disp metal num" style="font-size:28px">${g ? g.ev.reps : '–'}</b></div></div><span class="lbl">${who}</span><span class="help" style="font-size:12px;text-align:center">${g ? esc(g.title) : 'No Marriage goal'}</span></div>`;
}

async function renderInvite(root, reload) {
  let hh = state.household;
  root.innerHTML = `<div class="page-h"><div><span class="lbl">Team</span><h1 class="disp metal">You + your spouse</h1></div></div>
    <section class="panel"><div class="empty" id="inv"></div></section>`;
  const el = $('#inv', root);
  const draw = () => {
    const link = hh ? `${location.origin}/join/home/${hh.invite_code}` : '';
    el.innerHTML = `<h2 class="disp" style="font-size:34px;margin:0">Link with your spouse</h2>
      <p class="help">Once linked, you see each other's goals and red flags, share Marriage reps (one check counts for both), and share one household Budget goal your crew never sees.</p>
      ${hh ? `<div class="invite"><span class="lbl">Invite link</span><code class="num">${esc(link)}</code><div class="chips"><button class="btn small" id="copy">Copy link</button><a class="btn small" href="${smsLink('', `Join me on THOUSAND so we can be a team: ${link}`)}">Text it</a></div><span class="help" style="font-size:12.5px">Or they can enter code <b class="num" style="color:var(--fg)">${esc(hh.invite_code)}</b> on this screen.</span></div>`
        : '<button class="btn primary" id="mk">Create an invite link</button>'}
      <form id="code" class="m-form" style="max-width:360px"><span class="input"><input placeholder="Have a code? Enter it" maxlength="8" aria-label="Invite code" style="text-transform:uppercase"></span><button class="btn small">Join</button></form><p class="help" id="err" role="alert" style="color:var(--bad)"></p>`;
    const mk = $('#mk', el); if (mk) mk.onclick = async () => { try { hh = await api.ensureHousehold(); state.household = hh; draw(); } catch (e) { $('#err', el).textContent = e.message; } };
    const cp = $('#copy', el); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Link copied'); } catch { toast('Copy failed. Press and hold the link to copy it.'); } };
    $('#code', el).onsubmit = async (e) => { e.preventDefault(); const v = $('#code input', el).value.trim(); if (!v) return;
      try { await api.joinHousehold(v); toast('Linked'); reload(); } catch (err) { $('#err', el).textContent = err.message; } };
  };
  draw();
}
