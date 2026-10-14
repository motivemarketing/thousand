import './styles.css';
import { api, configured } from './lib/api.js';
import { loadAll, state } from './lib/store.js';
import { svgDefs, $, esc, avatar } from './ui/kit.js';
import { playIntro } from './ui/intro.js';

const screens = {
  signin: () => import('./screens/signin.js'),
  onboarding: () => import('./screens/onboarding.js'),
  today: () => import('./screens/today.js'),
  newgoal: () => import('./screens/newgoal.js'),
  team: () => import('./screens/team.js'),
  crew: () => import('./screens/crew.js'),
  me: () => import('./screens/me.js'),
  join: () => import('./screens/join.js'),
};

const app = document.getElementById('app');
document.body.insertAdjacentHTML('afterbegin', svgDefs());
let cleanup = null, introDone = false;

export function go(path, replace = false) {
  if (replace) history.replaceState({}, '', path); else history.pushState({}, '', path);
  route();
}
window.addEventListener('popstate', () => route());
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]');
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault(); go(a.getAttribute('href'));
});

const ICONS = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="10" r="3.2"/><circle cx="15.5" cy="10" r="3.2"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.2 1 5 2.6M12.5 16c.9-1 2-1.5 3-1.5 2.5 0 4.4 1.6 5 4.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  crew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="11" r="2.3"/><circle cx="18.5" cy="11" r="2.3"/><path d="M7 19c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5M2.5 18c.3-1.8 1.5-2.9 3-3.1M21.5 18c-.3-1.8-1.5-2.9-3-3.1"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="3.6"/><path d="M5 20c1-3.6 3.8-5.4 7-5.4s6 1.8 7 5.4"/></svg>',
};
function shell(active) {
  const t = (key, href, label) => `<a href="${href}" data-link class="${active === key ? 'on' : ''}" ${active === key ? 'aria-current="page"' : ''}><span class="t-ic">${ICONS[key]}</span>${label}</a>`;
  return `<div class="shell"><nav class="topnav" aria-label="Main">
    <a class="mark" href="/" data-link aria-label="THOUSAND home">THOUSAND<i></i></a>
    <div class="tabs">${t('today', '/', 'Today')}${t('team', '/team', 'Team')}${t('plus', '/goals/new', 'New goal')}${t('crew', '/crew', 'Crew')}${t('me', '/me', 'Me')}</div>
    <a class="me-link" href="/me" data-link aria-label="Your profile">${avatar(state.me, 36)}</a>
  </nav><main class="wrap" id="screen"></main></div>`;
}

async function mount(name, withShell, params = {}) {
  if (cleanup) { try { cleanup(); } catch {} cleanup = null; }
  const mod = await screens[name]();
  let root = app;
  if (withShell) { app.innerHTML = shell(params.tab || name); root = $('#screen'); }
  else app.innerHTML = '';
  window.scrollTo(0, 0);
  cleanup = (await mod.render(root, { go, params, reload: () => route() })) || null;
}

async function route() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const join = path.match(/^\/join\/(home|crew)\/([A-Za-z0-9]+)$/);
  if (join) { try { localStorage.setItem('thousand-join', JSON.stringify({ kind: join[1], code: join[2] })); } catch {} }

  const session = (configured || localStorage.getItem('thousand-mode') === 'demo') ? await api.session().catch(() => null) : null;
  if (!session) return mount('signin', false, { join: join && { kind: join[1], code: join[2] } });

  try { await loadAll(); } catch (e) {
    app.innerHTML = `<div class="loading"><div style="display:grid;gap:12px;justify-items:center;text-align:center;padding:24px"><b>Couldn't load your data.</b><span class="help">${esc(e.message)}</span><button class="btn" onclick="location.reload()">Try again</button></div></div>`;
    return;
  }
  if (!state.me.onboarded) return mount('onboarding', false);

  let pending = null; try { pending = JSON.parse(localStorage.getItem('thousand-join')); } catch {}
  if (pending) return mount('join', true, { ...pending, tab: 'crew' });

  if (!introDone) { introDone = true; playIntro(); }
  if (path === '/team') return mount('team', true);
  if (path === '/crew') return mount('crew', true);
  if (path === '/me') return mount('me', true);
  if (path === '/goals/new') return mount('newgoal', false);
  return mount('today', true, { goal: new URLSearchParams(location.search).get('goal') });
}

app.innerHTML = '<div class="loading">Loading…</div>';
if (configured) api.onAuthChange(() => {});
route();

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {});
