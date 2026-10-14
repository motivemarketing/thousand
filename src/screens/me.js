// Me: profile, guide, install, household, your data, sign out.
import { api, configured, useDemo } from '../lib/api.js';
import { state } from '../lib/store.js';
import { fmtPhone, digits } from '../lib/baseline.js';
import { $, $$, esc, avatar, GUIDES, orbGradient, squareJpeg, toast, fullName } from '../ui/kit.js';

export function render(root, { go, reload }) {
  const me = state.me, demo = api.mode === 'demo';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  root.innerHTML = `<div class="page-h"><div><span class="lbl">Me</span><h1 class="disp metal">${esc(me.first_name || 'Profile')}</h1></div>${demo ? '<span class="pill neutral">Demo mode</span>' : ''}</div>
    <section class="panel"><div class="sec-h"><h2 class="disp">Profile</h2><span class="lbl">Your spouse and crew see this</span></div>
      <form class="me-form" id="pf">
        <div class="photo"><label class="pic" for="fPhoto" style="width:110px;height:110px">${me.photo_url ? `<img src="${esc(me.photo_url)}" alt="Your profile photo">` : `<span>${esc(((me.first_name || '?')[0] + (me.last_name?.[0] || '')).toUpperCase())}</span>`}</label>
          <div style="display:grid;gap:8px;justify-items:start"><label class="btn small" for="fPhoto">Change photo</label>${me.photo_url ? '<button type="button" class="btn small ghost" id="rmPhoto">Remove photo</button>' : ''}</div><input id="fPhoto" type="file" accept="image/*" hidden></div>
        <div class="inrow"><label class="field"><span>First name</span><span class="input"><input name="first_name" value="${esc(me.first_name || '')}" autocomplete="given-name" required></span></label>
          <label class="field"><span>Last name</span><span class="input"><input name="last_name" value="${esc(me.last_name || '')}" autocomplete="family-name"></span></label></div>
        <label class="field" style="max-width:320px"><span>Mobile number</span><span class="input"><input name="phone" type="tel" value="${esc(me.phone || '')}" autocomplete="tel"></span></label>
        <div><button class="btn primary" type="submit">Save profile</button></div></form></section>
    <section class="panel"><div class="sec-h"><h2 class="disp">Your guide</h2><span class="lbl">Switch anytime</span></div>
      <div class="guides me-guides">${Object.entries(GUIDES).map(([k, g]) => `<button class="gcard ${me.guide === k ? 'on' : ''}" data-k="${k}" aria-pressed="${me.guide === k}"><span class="ball" style="background:${orbGradient(k)}"></span><span><b>${g.name}</b><span class="lbl">${g.role}</span><em>“${g.sample}”</em></span></button>`).join('')}</div></section>
    <section class="panel"><div class="sec-h"><h2 class="disp">Put it on your home screen</h2></div><div class="empty">
      ${standalone ? '<p class="help">THOUSAND is installed on this device.</p>' : ios
        ? '<p class="help">On iPhone: open this page in <b>Safari</b>, tap the <b>Share</b> button, then <b>Add to Home Screen</b>. THOUSAND then opens full screen like an app.</p>'
        : '<p class="help">On Android: tap the browser menu (⋮), then <b>Install app</b> or <b>Add to Home screen</b>.</p><button class="btn small" id="install" hidden>Install THOUSAND</button>'}</div></section>
    <section class="panel"><div class="sec-h"><h2 class="disp">Household</h2></div><div class="empty">
      ${state.spouse ? `<div style="display:flex;gap:12px;align-items:center">${avatar(state.spouse, 40)}<span>Linked with <b>${esc(fullName(state.spouse))}</b></span></div><button class="btn small danger" id="leaveHH">Unlink household</button>`
        : '<p class="help">Not linked with a spouse yet.</p><a class="btn small" href="/team" data-link>Link with your spouse</a>'}</div></section>
    <section class="panel"><div class="sec-h"><h2 class="disp">Your data</h2></div><div class="empty">
      <p class="help">Private answers (struggles, mood screens, health numbers) are visible only to you. Your spouse sees your goals and marriage answers. Your crew sees five areas, never Budget. No ads. Nothing is sold.</p>
      <div class="chips"><button class="btn small" id="export">Download my data</button><button class="btn small" id="out">${demo ? 'Exit demo' : 'Sign out'}</button></div>
      <details class="danger-zone"><summary>Delete my account</summary><p class="help">This permanently deletes your profile, baseline, goals and reps. A household Budget goal stays with your spouse. Type DELETE to confirm.</p>
        <form id="del" class="m-form" style="max-width:360px"><span class="input"><input aria-label="Type DELETE to confirm" autocomplete="off"></span><button class="btn small danger">Delete</button></form></details></div></section>`;

  $('#pf', root).onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.target);
    const phone = String(f.get('phone') || ''); if (phone && digits(phone).length < 10) { toast('Enter a 10-digit mobile number'); return; }
    try { await api.saveMe({ first_name: String(f.get('first_name')).trim(), last_name: String(f.get('last_name')).trim(), phone: fmtPhone(phone) }); toast('Profile saved'); reload(); } catch (err) { toast(err.message); } };
  $('#fPhoto', root).onchange = async (e) => { const file = e.target.files?.[0]; if (!file) return;
    try { toast('Uploading…'); const url = await api.uploadPhoto(await squareJpeg(file)); await api.saveMe({ photo_url: url }); toast('Photo updated'); reload(); } catch (err) { toast(err.message); } };
  const rm = $('#rmPhoto', root); if (rm) rm.onclick = async () => { await api.saveMe({ photo_url: null }); toast('Photo removed'); reload(); };
  $$('.me-guides .gcard', root).forEach((b) => (b.onclick = async () => { try { await api.saveMe({ guide: b.dataset.k }); toast(`${GUIDES[b.dataset.k].name} is your guide`); reload(); } catch (err) { toast(err.message); } }));
  const lh = $('#leaveHH', root); if (lh) lh.onclick = async () => {
    if (lh.dataset.confirm !== '1') { lh.dataset.confirm = '1'; lh.textContent = 'Tap again to unlink'; return; }
    try { await api.leaveHousehold(); toast('Unlinked'); reload(); } catch (err) { toast(err.message); } };
  $('#export', root).onclick = async () => {
    try { const data = await api.exportData(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = `thousand-data-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); } catch (err) { toast(err.message); } };
  $('#out', root).onclick = async () => { await api.signOut(); if (demo) useDemo(false); location.href = '/'; };
  $('#del', root).onsubmit = async (e) => { e.preventDefault(); if ($('#del input', root).value.trim() !== 'DELETE') { toast('Type DELETE to confirm'); return; }
    try { await api.deleteAccount(); if (demo) useDemo(false); location.href = '/'; } catch (err) { toast(err.message); } };
  const inst = $('#install', root);
  if (inst && window.__installPrompt) { inst.hidden = false; inst.onclick = () => window.__installPrompt.prompt(); }
}
