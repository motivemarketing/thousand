import { api, configured, useDemo } from '../lib/api.js';
import { demo } from '../lib/demo.js';
import { Orb, $, esc } from '../ui/kit.js';

export function render(root, { params, reload }) {
  root.innerHTML = `<div class="flow">
    <aside class="flow-left" style="--g1:#FF4D1A">
      <div class="flow-top"><span class="mark">THOUSAND<i></i></span></div>
      <div class="flow-stage"><canvas id="orb" style="width:min(300px,60%);aspect-ratio:1;border-radius:50%" aria-hidden="true"></canvas>
        <p style="margin:0;max-width:420px;font-size:18px;font-weight:500">Same spot. Every day. Faith, marriage, parenting, health, work and money, measured with the people who keep you honest.</p></div>
      <div></div>
    </aside>
    <main class="flow-pane"><div></div><div class="flow-body"><div class="card" id="card"></div></div><div></div></main></div>`;
  const orb = Orb.make($('#orb'), 'ember', { detail: 48 });
  const card = $('#card');
  const joinNote = params.join ? `<div class="note good">You've been invited to join a ${params.join.kind === 'home' ? 'household' : 'crew'}. Sign in to accept.</div>` : '';

  const form = () => {
    card.innerHTML = `<div style="display:grid;gap:10px"><span class="lbl">Welcome</span><h1 class="disp metal chapter-title" style="font-size:clamp(56px,8vw,96px)">Sign in</h1>
      <p class="help">Enter your email and we'll send you a link. No password.</p></div>${joinNote}
      ${configured ? `<form id="f" style="display:grid;gap:12px"><label class="field"><span class="lbl">Email</span><span class="input"><input id="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com"></span></label>
        <button class="btn primary" type="submit" id="send">Email me a sign-in link</button><p class="help" id="err" role="alert" style="color:var(--bad)"></p></form>`
        : `<div class="note watch">Accounts aren't connected yet. Add your Supabase keys to turn on sign-in. Until then, try the demo.</div>`}
      <div style="display:grid;gap:8px;border-top:1px solid var(--line);padding-top:18px"><span class="lbl">Just looking?</span>
        <div class="chips"><button class="chip" id="demoFull">Try the demo with sample data</button><button class="chip" id="demoNew">Try the demo from onboarding</button></div>
        <p class="help" style="font-size:12.5px">The demo saves only in this browser.</p></div>`;
    const f = $('#f');
    if (f) f.onsubmit = async (e) => {
      e.preventDefault(); const email = $('#email').value.trim(); const b = $('#send');
      b.disabled = true; b.textContent = 'Sending…'; $('#err').textContent = '';
      try { await api.signIn(email); sent(email); } catch (err) { $('#err').textContent = err.message || 'Something went wrong. Try again.'; b.disabled = false; b.textContent = 'Email me a sign-in link'; }
    };
    $('#demoFull').onclick = () => { useDemo(true); demo.reset('full'); reload(); };
    $('#demoNew').onclick = () => { useDemo(true); demo.reset('new'); reload(); };
  };
  const sent = (email) => {
    orb.burst();
    card.innerHTML = `<div style="display:grid;gap:10px"><span class="lbl">Check your email</span><h1 class="disp metal chapter-title" style="font-size:clamp(48px,7vw,84px)">Link sent.</h1>
      <p class="help">We sent a sign-in email to <b style="color:var(--fg)">${esc(email)}</b>. Tap the link in it, or type the 6-digit code here. Using THOUSAND from your home screen? Use the code.</p></div>
      <form id="cf" style="display:grid;gap:12px;max-width:320px"><label class="field"><span class="lbl">Code</span><span class="input"><input id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required placeholder="123456" style="letter-spacing:.3em"></span></label>
        <button class="btn primary" type="submit" id="go">Sign in</button><p class="help" id="err" role="alert" style="color:var(--bad)"></p></form>
      <button class="btn ghost" id="again">Use a different email</button>`;
    $('#again').onclick = form;
    $('#cf').onsubmit = async (e) => { e.preventDefault(); const b = $('#go'); b.disabled = true; $('#err').textContent = '';
      try { await api.verifyCode(email, $('#code').value.trim()); reload(); } catch (err) { $('#err').textContent = 'That code didn\'t work. Check it, or request a new email.'; b.disabled = false; } };
  };
  form();
  return () => orb.dispose();
}
