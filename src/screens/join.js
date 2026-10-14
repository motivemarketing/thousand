// Accept an invite link to a household (spouse) or a crew.
import { api } from '../lib/api.js';
import { state } from '../lib/store.js';
import { $, esc, toast } from '../ui/kit.js';

export async function render(root, { params, go }) {
  const clear = () => { try { localStorage.removeItem('thousand-join'); } catch {} };
  const home = params.kind === 'home';
  root.innerHTML = '<div class="loading">Checking invite…</div>';
  const info = await api.peekInvite(params.kind, params.code).catch(() => null);
  if (!info) {
    root.innerHTML = `<section class="panel" style="margin-top:20px"><div class="empty"><h1 class="disp metal" style="font-size:48px;margin:0">Invite not found</h1><p class="help">That invite code (${esc(params.code)}) isn't valid. Ask for a new link.</p><button class="btn" id="ok">Go to today</button></div></section>`;
    $('#ok', root).onclick = () => { clear(); go('/', true); }; return;
  }
  const already = home && state.spouse;
  root.innerHTML = `<section class="panel" style="margin-top:20px"><div class="empty">
    <span class="lbl">${home ? 'Household invite' : 'Crew invite'}</span>
    <h1 class="disp metal" style="font-size:clamp(44px,7vw,72px);margin:0">${home ? `Link with ${esc(info.from || 'your spouse')}` : `Join ${esc(info.name)}`}</h1>
    <p class="help">${home ? 'You\'ll see each other\'s goals, share Marriage reps and one household Budget goal. Your crew never sees Budget.' : `${info.members} ${info.members === 1 ? 'person' : 'people'} in this crew. They'll see your Faith, Marriage, Parenting, Work-Life and Health goals and red flags. Never Budget.`}</p>
    ${already ? '<div class="note watch">You\'re already linked with a spouse. Accepting moves you to this household.</div>' : ''}
    <div class="chips"><button class="btn primary" id="yes">${home ? 'Link households' : 'Join crew'}</button><button class="btn ghost" id="no">Not now</button></div>
    <p class="help" id="err" role="alert" style="color:var(--bad)"></p></div></section>`;
  $('#no', root).onclick = () => { clear(); go('/', true); };
  $('#yes', root).onclick = async () => {
    try { home ? await api.joinHousehold(params.code) : await api.joinCrew(params.code); clear(); toast(home ? 'Linked' : 'Joined'); go(home ? '/team' : '/crew', true); }
    catch (e) { $('#err', root).textContent = e.message; }
  };
}
