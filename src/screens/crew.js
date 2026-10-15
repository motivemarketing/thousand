// Crew: friends see five areas (never Budget). Conversations happen in your group text, not here.
import { api } from '../lib/api.js';
import { state, crewGoalsOf, loggedToday } from '../lib/store.js';
import { scheduledOn, todayISO } from '../lib/rules.js';
import { $, $$, esc, dial, avatar, AREAS, CREW_AREAS, fullName, toast, smsLink } from '../ui/kit.js';

const STARTER = {
  faith: (n) => `Praying for you, ${n}. Want to read together tomorrow morning?`,
  marriage: (n) => `Thinking about you two, ${n}. How's home this week?`,
  parenting: (n) => `How are the kids, ${n}? Anything I can do?`,
  health: (n) => `Saw Health slipping. You good, ${n}? Want to get a workout in this week?`,
  worklife: (n) => `Work eating you alive, ${n}? Let's talk this week.`,
};
const bdaySoon = (md) => { if (!md) return null; const t = new Date(), y = t.getFullYear(); let d = new Date(`${y}-${md}T00:00:00`); if (d < new Date(t.toDateString())) d = new Date(`${y + 1}-${md}T00:00:00`); const n = Math.round((d - new Date(t.toDateString())) / 864e5); return n <= 7 ? n : null; };

export function render(root, { reload }) {
  const crews = state.crews;
  root.innerHTML = `<div class="page-h"><div><span class="lbl">Crew</span><h1 class="disp metal">Crew</h1></div><span class="lbl">Five areas. Budget stays at home.</span></div>
    ${crews.map((c) => crewHTML(c)).join('')}
    <section class="panel"><div class="sec-h"><h2 class="disp">${crews.length ? 'Another crew' : 'Start a crew'}</h2></div>
      <div class="empty"><p class="help">Your crew sees your progress, reps and red flags in Faith, Marriage, Parenting, Work-Life and Health. Talk in your group text. THOUSAND just shows who needs a call.</p>
        <form id="mk" class="m-form" style="max-width:420px"><span class="input"><input maxlength="40" placeholder="Crew name, like Tuesday Crew" aria-label="Crew name"></span><button class="btn small">Create</button></form>
        <form id="jn" class="m-form" style="max-width:420px"><span class="input"><input maxlength="8" placeholder="Have a code? Enter it" aria-label="Crew invite code" style="text-transform:uppercase"></span><button class="btn small">Join</button></form>
        <p class="help" id="err" role="alert" style="color:var(--bad)"></p></div></section>`;

  $('#mk', root).onsubmit = async (e) => { e.preventDefault(); try { await api.createCrew($('#mk input', root).value.trim()); toast('Crew created'); reload(); } catch (err) { $('#err', root).textContent = err.message; } };
  $('#jn', root).onsubmit = async (e) => { e.preventDefault(); const v = $('#jn input', root).value.trim(); if (!v) return; try { await api.joinCrew(v); toast('Joined'); reload(); } catch (err) { $('#err', root).textContent = err.message; } };
  $$('[data-copy]', root).forEach((b) => (b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Link copied'); } catch { toast('Copy failed. Press and hold the link to copy it.'); } }));
  $$('[data-leave]', root).forEach((b) => (b.onclick = async () => {
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Tap again to leave'; b.classList.add('danger'); return; }
    try { await api.leaveCrew(b.dataset.leave); toast('You left the crew'); reload(); } catch (err) { toast(err.message); } }));
}

function crewHTML(c) {
  const link = `${location.origin}/join/crew/${c.invite_code}`;
  const others = c.memberIds.filter((id) => id !== state.me.id).map((id) => state.people[id]).filter(Boolean);
  return `<section class="panel"><div class="sec-h"><h2 class="disp">${esc(c.name)}</h2><span class="lbl">${others.length + 1} people</span></div>
    ${others.length ? others.map(memberRow).join('') : '<div class="empty"><p class="help">Nobody else yet. Send the invite link to your group text.</p></div>'}
    <div class="crew-foot"><div class="invite"><span class="lbl">Invite link · code ${esc(c.invite_code)}</span><code class="num">${esc(link)}</code>
      <div class="chips"><button class="btn small" data-copy="${esc(link)}">Copy link</button><a class="btn small" href="${smsLink('', `Join our crew on THOUSAND: ${link}`)}">Text it</a><button class="btn small ghost" data-leave="${c.id}">Leave crew</button></div></div></div></section>`;
}

// Reps due today across a person's crew-visible goals, and how many they've logged.
export function repsToday(id) {
  const day = todayISO(), w = new Date().getDay();
  const due = crewGoalsOf(id).filter((g) => g.status === 'active' && day >= g.start_date && day <= g.end_date).flatMap((g) => g.habits.filter((h) => scheduledOn(h, day, w)));
  return [due.filter((h) => loggedToday(h.id, day)).length, due.length];
}
// Crew members across all your crews, people with a red flag first.
export function crewPeople() {
  const ids = [...new Set(state.crews.flatMap((c) => c.memberIds))].filter((id) => id !== state.me.id && state.people[id]);
  const flagged = (id) => crewGoalsOf(id).some((g) => g.ev.slipping && g.status === 'active');
  return ids.map((id) => state.people[id]).sort((a, b) => flagged(b.id) - flagged(a.id) || (a.first_name || '').localeCompare(b.first_name || ''));
}

export function memberRow(p) {
  const goals = crewGoalsOf(p.id), slipping = goals.filter((g) => g.ev.slipping && g.status === 'active'), bd = bdaySoon(p.birthday_md);
  const [done, due] = repsToday(p.id), todayTxt = new Date().getDay() === 0 ? 'Sabbath' : due ? `${done} of ${due} reps today` : 'Nothing due today';
  const first = esc(p.first_name || 'friend');
  return `<div class="crew-row"><div class="who">${avatar(p, 44)}<div><b>${esc(fullName(p))}</b><small>${bd === 0 ? 'Birthday today · ' : bd != null ? `Birthday in ${bd} day${bd > 1 ? 's' : ''} · ` : ''}${goals.length ? `${todayTxt} · ${goals.filter((g) => g.ev.pace >= 0).length} of ${goals.length} on pace` : 'No goals yet'}</small></div></div>
    <div class="minirings five">${CREW_AREAS.map((a) => { const g = goals.find((x) => x.area === a && x.status !== 'archived'); const flag = g?.ev.slipping;
      return `<div class="mr ${flag ? 'flag' : ''} ${g ? '' : 'none'}" title="${g ? esc(g.title) : 'No goal'}"><div class="dial">${dial(g ? g.ev.frac : 0, flag ? 'bad' : a, { n: 36, w: 2.8, r1: 0.34, r2: 0.48 })}<div class="mid"><b class="num">${g ? Math.round(g.ev.frac * 100) : '–'}</b></div></div><span>${AREAS[a].n}</span></div>`; }).join('')}</div>
    <div class="flags">${slipping.length ? slipping.map((g) => `<div class="flagline">${AREAS[g.area].n} slipping · ${g.ev.missed} days without “${esc(g.habits[0]?.name || '')}”</div>`).join('')
      + (p.phone ? `<a class="btn small primary" href="${smsLink(p.phone, STARTER[slipping[0].area](p.first_name || 'friend'))}">Text ${first}</a>` : '') : '<div class="flagline ok">No red flags.</div>'}</div></div>`;
}
