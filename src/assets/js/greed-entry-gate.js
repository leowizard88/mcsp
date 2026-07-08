(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;
  const css = document.createElement('style');
  css.textContent = `
    body.greed-entry-locked .greed-game{display:none!important}
    .greed-entry-gate{position:fixed;inset:0;z-index:80;background:#000;display:none;place-items:center;color:#fff;font-family:Arial,Helvetica,sans-serif}.greed-entry-gate.is-open{display:grid}.greed-entry-inner{text-align:center;display:grid;gap:22px;justify-items:center}.greed-entry-title{font:900 clamp(34px,8vw,104px)/.88 Impact,Haettenschweiler,'Arial Black',sans-serif;color:#ffe16a;text-transform:uppercase;text-shadow:0 4px 0 #7c2d00,0 8px 0 #1a0700;letter-spacing:.03em}.greed-entry-btn{border:4px solid #132400;background:linear-gradient(180deg,#f4ff8e,#86d900 58%,#1f7000);color:#071400;font:900 clamp(24px,4.8vw,58px)/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;letter-spacing:.08em;padding:18px 34px;cursor:pointer;box-shadow:0 8px 0 #061400,0 0 34px rgba(223,255,115,.4)}.greed-entry-welcome{display:none;font:900 clamp(32px,7vw,96px)/.92 Impact,Haettenschweiler,'Arial Black',sans-serif;color:#fff;text-transform:uppercase;text-shadow:0 0 24px rgba(255,255,255,.45),4px 4px 0 #000;animation:giWelcome .9s ease both}.greed-entry-gate.is-welcome .greed-entry-btn,.greed-entry-gate.is-welcome .greed-entry-title{display:none}.greed-entry-gate.is-welcome .greed-entry-welcome{display:block}@keyframes giWelcome{0%{opacity:0;transform:scale(.86)}35%{opacity:1;transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}.greed-entry-gate.is-fading{animation:giFade .38s ease forwards}@keyframes giFade{to{opacity:0;visibility:hidden}}
  `;
  document.head.appendChild(css);
  const gate = document.createElement('div');
  gate.className = 'greed-entry-gate';
  gate.innerHTML = '<div class="greed-entry-inner"><div class="greed-entry-title">Personaggio pronto</div><button type="button" class="greed-entry-btn">ENTRA</button><div class="greed-entry-welcome">BENVENUTO A<br>GREED ISLAND</div></div>';
  document.body.appendChild(gate);
  const keyFor = c => `greedEntered:${c?.userId || c?.nome || 'player'}`;
  const showGate = c => {
    if (!c?.ready || localStorage.getItem(keyFor(c)) === '1') return;
    document.body.classList.add('greed-entry-locked');
    gate.classList.add('is-open');
  };
  const check = async () => {
    if (!token()) return;
    try {
      const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.character) showGate(data.character);
    } catch {}
  };
  gate.querySelector('button').addEventListener('click', async () => {
    let c = null;
    try {
      const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      c = data.character;
    } catch {}
    if (c) localStorage.setItem(keyFor(c), '1');
    gate.classList.add('is-welcome');
    setTimeout(() => gate.classList.add('is-fading'), 900);
    setTimeout(() => {
      gate.classList.remove('is-open','is-welcome','is-fading');
      document.body.classList.remove('greed-entry-locked');
    }, 1300);
  });
  window.addEventListener('greed-character-updated', e => showGate(e.detail));
  setTimeout(check, 700);
  setInterval(check, 2500);
})();
