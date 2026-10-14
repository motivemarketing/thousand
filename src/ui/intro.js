// The Eric Thomas quote that opens the app every time it launches.
export function playIntro() {
  const el = document.createElement('div');
  el.className = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Opening quote');
  const parts = [['s1', 'If you hit an oak tree a thousand times in a thousand different places, nothing is going to happen to that tree.'],
    ['s2', 'But if you hit it a thousand times in'], ['acc', 'the same place,'], ['s2', "it's going to come down."]];
  let i = 0; const step = 55;
  el.innerHTML = `<blockquote>${parts.map(([c, t]) => `<span class="${c}">${t.split(' ').map((w) => `<span class="w" style="--d:${(i++) * step}ms">${w}</span>`).join(' ')}</span>`).join(' ')}</blockquote>
    <cite class="lbl" style="--d:${i * step + 150}ms">Eric Thomas</cite><button class="skip">Skip</button>`;
  document.body.appendChild(el);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gone = false;
  const leave = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => el.remove(), 900); document.removeEventListener('keydown', key); };
  const key = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) leave(); };
  el.onclick = leave; document.addEventListener('keydown', key);
  setTimeout(leave, reduce ? 2600 : i * step + 2600);
}
