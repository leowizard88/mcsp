(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const game = document.querySelector('[data-greed-game]');
  const paramCard = document.querySelector('.param-card');
  if (!game) return;
  const labels = { forza:'Forza', robustezza:'Robustezza', nen:'Nen', intelligenza:'Intelligenza', malizia:'Malizia', agilita:'Agilità', oratoria:'Oratoria', percezione:'Percezione' };
  const css = document.createElement('style');
  css.textContent = `
    body.greed-entry-animating .greed-game,body.greed-param-enter-needed .greed-game,body.greed-param-enter-needed .delete-character{display:none!important}
    body.greed-param-enter-needed .param-card{display:block!important;position:relative;overflow:hidden}
    body.greed-param-enter-needed .creation-card{display:none!important}
    .gi-param-enter{margin:22px auto 0;display:block;border:4px solid #132400;background:linear-gradient(180deg,#f7ff9c,#a9ff19 44%,#38a900 74%,#145000);color:#071400;font:900 clamp(28px,5vw,64px)/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;letter-spacing:.09em;padding:18px 42px;cursor:pointer;box-shadow:0 8px 0 #061400,0 0 22px rgba(223,255,115,.65),0 0 58px rgba(142,255,0,.38);animation:giEnterGlow 1.35s ease-in-out infinite;position:relative;z-index:2}.gi-param-enter::before{content:"";position:absolute;inset:-4px;background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,.0) 30%,rgba(255,255,255,.85) 48%,rgba(255,255,255,.0) 64%,transparent 100%);transform:translateX(-130%);animation:giEnterShine 1.8s ease-in-out infinite;pointer-events:none}.gi-param-enter:hover{transform:translateY(-2px)}.gi-param-enter-note{text-align:center;margin:12px 0 0;color:#dfff73;font:900 13px/1.3 'Courier New',monospace;text-transform:uppercase;text-shadow:2px 2px 0 #000}.gi-ready-row{display:grid;grid-template-columns:minmax(120px,1fr) 60px;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.48);padding:9px 10px}.gi-ready-row span:first-child{font-weight:900;text-transform:uppercase;color:#f4ffe8}.gi-ready-row strong{text-align:center;color:#ffe16a;font-weight:900}.greed-entry-gate{position:fixed;inset:0;z-index:140;background:#000;display:none;place-items:center;color:#fff;font-family:Arial,Helvetica,sans-serif}.greed-entry-gate.is-open{display:grid}.greed-entry-welcome{font:900 clamp(38px,8vw,124px)/.88 Impact,Haettenschweiler,'Arial Black',sans-serif;color:#fff;text-align:center;text-transform:uppercase;letter-spacing:.035em;text-shadow:0 0 18px rgba(255,255,255,.65),0 0 52px rgba(255,225,106,.55),5px 5px 0 #000,0 8px 0 #7c2d00;opacity:0}.greed-entry-gate.is-slow .greed-entry-welcome{animation:giWelcomeSlow 2.45s cubic-bezier(.16,.82,.18,1) both}.greed-entry-gate.is-fast .greed-entry-welcome{animation:giWelcomeFast .78s ease both}.greed-entry-gate.is-fading{animation:giFade .72s ease forwards}@keyframes giEnterGlow{0%,100%{filter:brightness(1);box-shadow:0 8px 0 #061400,0 0 22px rgba(223,255,115,.65),0 0 58px rgba(142,255,0,.38)}50%{filter:brightness(1.25);box-shadow:0 8px 0 #061400,0 0 34px rgba(255,255,180,.95),0 0 88px rgba(142,255,0,.72)}}@keyframes giEnterShine{0%{transform:translateX(-130%)}45%,100%{transform:translateX(130%)}}@keyframes giWelcomeSlow{0%{opacity:0;transform:scale(.72);letter-spacing:.16em;filter:blur(8px)}38%{opacity:1;transform:scale(1.08);letter-spacing:.04em;filter:blur(0)}70%{opacity:1;transform:scale(1);letter-spacing:.035em}100%{opacity:1;transform:scale(1)}}@keyframes giWelcomeFast{0%{opacity:0;transform:scale(.92)}40%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}@keyframes giFade{to{opacity:0;visibility:hidden}}
  `;
  document.head.appendChild(css);
  const gate = document.createElement('div');
  gate.className = 'greed-entry-gate';
  gate.innerHTML = '<div class="greed-entry-welcome">BENVENUTO A<br>GREED ISLAND</div>';
  document.body.appendChild(gate);

  let lastCharacter = null;
  let sawSetup = document.body.classList.contains('has-param-setup');
  let busy = false;
  const keyFor = c => `greedEntered:${c?.userId || c?.nome || 'player'}`;
  const apiCharacter = async () => {
    if (!token()) return null;
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    return res.ok ? data.character : null;
  };
  const renderReadyCard = c => {
    const card = document.querySelector('.param-card');
    if (!card || !c) return;
    const params = c.params || {};
    card.innerHTML = `<h1>Scheda parametri</h1><p class="param-note">Punti iniziali rimasti: <strong>0</strong> / 10</p><div class="stat-list">${Object.entries(labels).map(([k,label]) => `<div class="gi-ready-row"><span>${label}</span><strong>${params[k] || 0}</strong></div>`).join('')}</div><p class="gi-param-enter-note">Parametri completati. Greed Island ti sta aspettando.</p><button type="button" class="gi-param-enter" data-gi-param-enter>ENTRA</button><p class="stat-error" data-stat-error></p>`;
    card.querySelector('[data-gi-param-enter]')?.addEventListener('click', () => startWelcome(c, 'slow'));
  };
  const startWelcome = (c, speed = 'fast') => {
    if (!c || busy) return;
    busy = true;
    localStorage.setItem(keyFor(c), '1');
    document.body.classList.remove('greed-param-enter-needed','has-param-setup');
    document.body.classList.add('greed-entry-animating');
    gate.className = `greed-entry-gate is-open ${speed === 'slow' ? 'is-slow' : 'is-fast'}`;
    const hold = speed === 'slow' ? 2450 : 760;
    const fade = speed === 'slow' ? 720 : 360;
    setTimeout(() => gate.classList.add('is-fading'), hold);
    setTimeout(() => {
      gate.className = 'greed-entry-gate';
      document.body.classList.remove('greed-entry-animating');
      document.body.classList.add('has-greed-profile');
      busy = false;
    }, hold + fade);
  };
  const evaluate = async (incoming = null) => {
    if (busy) return;
    const c = incoming || await apiCharacter();
    if (!c) return;
    lastCharacter = c;
    if ((c.setupPoints || 0) > 0) {
      sawSetup = true;
      document.body.classList.remove('greed-param-enter-needed');
      return;
    }
    if (!c.ready || localStorage.getItem(keyFor(c)) === '1') return;
    if (sawSetup || document.body.classList.contains('has-param-setup')) {
      document.body.classList.add('greed-param-enter-needed');
      renderReadyCard(c);
      return;
    }
    startWelcome(c, 'fast');
  };
  window.addEventListener('greed-character-updated', e => evaluate(e.detail));
  const observer = new MutationObserver(() => {
    if (document.body.classList.contains('has-param-setup')) sawSetup = true;
    if (document.body.classList.contains('has-greed-profile') && sawSetup && lastCharacter?.ready && localStorage.getItem(keyFor(lastCharacter)) !== '1') {
      document.body.classList.add('greed-param-enter-needed');
      renderReadyCard(lastCharacter);
    }
  });
  observer.observe(document.body, { attributes:true, attributeFilter:['class'] });
  setTimeout(() => evaluate(), 800);
  setInterval(() => evaluate(), 1800);
})();
