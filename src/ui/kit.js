// Small shared UI helpers.
import { Orb, GUIDES, orbGradient } from './orb.js';

export const AREAS = {
  faith: { n: 'Faith', hint: 'Scripture, prayer, the people you pray for' },
  marriage: { n: 'Marriage', hint: 'Time, prayer and connection with your spouse' },
  parenting: { n: 'Parenting', hint: 'Presence and faith at home' },
  health: { n: 'Health', hint: 'Movement, sleep, food, numbers' },
  worklife: { n: 'Work-Life', hint: 'Boundaries, rest and focus' },
  budget: { n: 'Budget', hint: 'Household money, shared with your spouse' },
};
export const AREA_ORDER = ['faith', 'marriage', 'parenting', 'health', 'worklife', 'budget'];
export const CREW_AREAS = ['faith', 'marriage', 'parenting', 'worklife', 'health'];
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const num = (v) => { const n = Number(v); return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 }); };
export const amt = (v, u = '') => u === '$' ? '$' + num(v) : u.startsWith('$ ') ? '$' + num(v) + u.slice(1) : `${num(v)} ${u}`.trim();
export const fmtDate = (s, o = { month: 'short', day: 'numeric' }) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', o); };
export const initials = (p) => `${(p?.first_name || '?')[0]}${(p?.last_name || '')[0] || ''}`.toUpperCase();
export const avatar = (p, size = 36) => `<span class="avatar" style="--av:${size}px">${p?.photo_url ? `<img src="${esc(p.photo_url)}" alt="">` : esc(initials(p))}</span>`;
export const fullName = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Someone';
export const measureLine = (g) => !g.measure_kind ? '' : g.measure_kind === 'count' ? `0 → ${amt(g.goal_value, g.unit)}` : `${amt(g.start_value, g.unit)} → ${amt(g.goal_value, g.unit)}`;

/** Tick dial: glossy filled ticks around a domed center. */
export function dial(fr, area, { n = 60, w = 2.4, r1 = 0.37, r2 = 0.48, dome = true } = {}) {
  const on = Math.round(Math.max(0, Math.min(1, fr)) * n); let tr = '', fl = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const l = `<line x1="${(50 + Math.cos(a) * 100 * r1).toFixed(2)}" y1="${(50 + Math.sin(a) * 100 * r1).toFixed(2)}" x2="${(50 + Math.cos(a) * 100 * r2).toFixed(2)}" y2="${(50 + Math.sin(a) * 100 * r2).toFixed(2)}"/>`;
    if (i < on) fl += l; else tr += l;
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${dome ? `<circle cx="50" cy="50" r="${100 * (r1 - 0.04)}" fill="url(#dome)" style="stroke:color-mix(in srgb,var(--fg) 7%,transparent);stroke-width:.6"/>` : ''}
    <g style="stroke:var(--track);stroke-width:${w};stroke-linecap:round">${tr}</g><g filter="url(#glow)" style="stroke:url(#gr-${area});stroke-width:${w};stroke-linecap:round">${fl}</g></svg>`;
}
export function svgDefs() {
  const g = (k) => `<linearGradient id="gr-${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100"><stop offset="0" style="stop-color:color-mix(in srgb,var(--${k}) 45%,#fff)"/><stop offset=".5" style="stop-color:var(--${k})"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--${k}) 72%,#000)"/></linearGradient>`;
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${[...AREA_ORDER, 'acc', 'bad'].map(g).join('')}
    <radialGradient id="dome" cx=".35" cy=".28" r=".8"><stop offset="0" style="stop-color:color-mix(in srgb,var(--fg) 14%,var(--s2))"/><stop offset=".55" style="stop-color:var(--s1)"/><stop offset="1" style="stop-color:color-mix(in srgb,var(--bg) 70%,var(--s1))"/></radialGradient>
    <filter id="glow" filterUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120"><feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs></svg>`;
}

let toastT;
export function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

/** Full-screen guide moment. */
let mOrb = null, mTimer = null;
export function moment({ eye, head, sub = '', line = '', color = 'var(--acc)', guide = 'ember' }) {
  let el = $('#moment');
  if (!el) {
    el = document.createElement('div'); el.id = 'moment'; el.className = 'moment'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="m-stage"><span class="m-ring"></span><span class="m-ring"></span><span class="m-ring"></span><canvas aria-hidden="true"></canvas></div>
      <div class="m-eye"></div><h2 class="m-head disp metal"></h2><div class="m-sub num"></div><p class="m-line"></p><span class="hint" style="margin-top:12px">Tap to close</span>`;
    document.body.appendChild(el);
    el.onclick = closeMoment;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMoment(); });
  }
  el.style.setProperty('--m1', color);
  $('.m-eye', el).textContent = eye; $('.m-head', el).textContent = head; $('.m-sub', el).textContent = sub; $('.m-line', el).innerHTML = line;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  if (!mOrb) mOrb = Orb.make($('canvas', el), guide, { detail: 56 });
  mOrb.setGuide(guide); mOrb.setMood('celebrate'); setTimeout(() => mOrb.burst(), 250);
  clearTimeout(mTimer); mTimer = setTimeout(closeMoment, 5200);
}
export function closeMoment() { $('#moment')?.classList.remove('on'); clearTimeout(mTimer); }

/** Downscale and crop an image file to a square JPEG blob. */
export function squareJpeg(file, size = 400) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'), m = Math.min(img.width, img.height); c.width = c.height = size;
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
      c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that photo'))), 'image/jpeg', 0.86);
    }; img.onerror = () => rej(new Error('Could not read that photo')); img.src = r.result; };
    r.onerror = () => rej(new Error('Could not read that photo')); r.readAsDataURL(file);
  });
}

export const smsLink = (phone, body) => `sms:${String(phone || '').replace(/[^\d+]/g, '')}${/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(body)}`;
export { GUIDES, Orb, orbGradient };
