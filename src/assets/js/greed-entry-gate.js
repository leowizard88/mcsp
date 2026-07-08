(() => {
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;

  const labels = { forza:'Forza', robustezza:'Robustezza', nen:'Nen', intelligenza:'Intelligenza', malizia:'Malizia', agilita:'Agilità', oratoria:'Oratoria', percezione:'Percezione' };
  const css = document.createElement('style');
  css.textContent = `
    body.greed-entry-animating .greed-game{visibility:hidden!important}.gi-param-enter-wrap{margin:22px auto 0;text-align:center}.gi-param-enter{margin:0 auto;display:block;border:4px solid #132400;background:linear-gradient(180deg,#fffec4,#d7ff2d 35%,#72e000 66%,#145000);color:#071400;font:900 clamp(25px,4.8vw,58px)/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;letter-spacing:.07em;padding:18px 34px;cursor:pointer;box-shadow:0 8px 0 #061400,0 0 26px rgba(223,255,115,.78),0 0 84px rgba(142,255,0,.52);animation:giEnterGlow 1.2s ease-in-out infinite;position:relative;z-index:2;overflow:hidden}.gi-param-enter::before{content:"";position:absolute;inset:-10px;background:linear-gradient(110deg,transparent 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,.92) 48%,rgba(255,255,255,0) 64%,transparent 100%);transform:translateX(-140%);animation:giEnterShine 1.45s ease-in-out infinite;pointer-events:none}.gi-param-enter.is-locked,.gi-param-enter:disabled{background:linear-gradient(180deg,#777,#444 60%,#242424);border-color:#555;color:#aaa;cursor:not-allowed;box-shadow:0 6px 0 #111;animation:none;filter:grayscale(1)}.gi-param-enter.is-locked::before,.gi-param-enter:disabled::before{display:none}.gi-param-enter-note{text-align:center;margin:12px 0 0;color:#dfff73;font:900 13px/1.3 'Courier New',monospace;text-transform:uppercase;text-shadow:2px 2px 0 #000}.gi-param-enter-note.is-locked{color:#bdbdbd}.gi-ready-row{display:grid;grid-template-columns:minmax(120px,1fr) 60px;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.48);padding:9px 10px}.gi-ready-row span:first-child{font-weight:900;text-transform:uppercase;color:#f4ffe8}.gi-ready-row strong{text-align:center;color:#ffe16a;font-weight:900}.greed-entry-gate{position:fixed;inset:0;z-index:140;background:#000;display:none;place-items:center;color:#fff;font-family:Arial,Helvetica,sans-serif}.greed-entry-gate.is-open{display:grid}.greed-entry-welcome{font:900 clamp(42px,8.8vw,136px)/.84 Impact,Haettenschweiler,'Arial Black',sans-serif;color:#fff;text-align:center;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 18px rgba(255,255,255,.8),0 0 58px rgba(255,225,106,.7),0 0 110px rgba(142,255,0,.35),6px 6px 0 #000,0 10px 0 #7c2d00;opacity:0}.greed-entry-gate.is-slow .greed-entry-welcome{animation:giWelcomeSlow 3.2s cubic-bezier(.13,.78,.16,1) both}.greed-entry-gate.is-fast .greed-entry-welcome{animation:giWelcomeFast .72s ease both}.greed-entry-gate.is-fading{animation:giFade .82s ease forwards}@keyframes giEnterGlow{0%,100%{filter:brightness(1);box-shadow:0 8px 0 #061400,0 0 26px rgba(223,255,115,.78),0 0 84px rgba(142,255,0,.52)}50%{filter:brightness(1.32);box-shadow:0 8px 0 #061400,0 0 42px rgba(255,255,190,1),0 0 116px rgba(142,255,0,.82)}}@keyframes giEnterShine{0%{transform:translateX(-140%)}55%,100%{transform:translateX(140%)}}@keyframes giWelcomeSlow{0%{opacity:0;transform:scale(.58) translateY(18px);letter-spacing:.22em;filter:blur(12px)}25%{opacity:1;filter:blur(0)}45%{transform:scale(1.13) translateY(0);letter-spacing:.055em}72%{transform:scale(.99);letter-spacing:.04em}100%{opacity:1;transform:scale(1)}}@keyframes giWelcomeFast{0%{opacity:0;transform:scale(.92)}40%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}@keyframes giFade{to{opacity:0;visibility:hidden}}
  `;
  document.head.appendChild(css);

  const gate = document.createElement('div');
  gate.className = 'greed-entry-gate';
  gate.innerHTML = '<div class="greed-entry-welcome">BENVENUTO A<br>GREED ISLAND</div>';
  document.body.appendChild(gate);

  let lastCharacter = null;
  let busy = false;
  const keyFor = c => `greedEnteredV6:${c?.userId || c?.nome || 'player'}:${c?.createdAt || 'created'}`;
  const startWelcome = (c, speed = 'slow') => {
    if (!c || busy) return;
    busy = true;
    localStorage.setItem(keyFor(c), '1');
    document.body.classList.remove('has-param-setup');
    document.body.classList.add('has-greed-profile', 'greed-entry-animating');
    gate.className = `greed-entry-gate is-open ${speed === 'slow' ? 'is-slow' : 'is-fast'}`;
    const hold = speed === 'slow' ? 3200 : 720;
    const fade = speed === 'slow' ? 820 : 340;
    setTimeout(() => gate.classList.add('is-fading'), hold);
    setTimeout(() => {
      gate.className = 'greed-entry-gate';
      document.body.classList.remove('greed-entry-animating');
      document.body.classList.add('has-greed-profile');
      busy = false;
    }, hold + fade);
  };
  const paramCard = () => document.querySelector('.param-card');
  const renderLocked = c => {
    const card = paramCard();
    if (!card || !c) return;
    let wrap = card.querySelector('[data-gi-param-enter-wrap]');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'gi-param-enter-wrap';
      wrap.dataset.giParamEnterWrap = '1';
      wrap.innerHTML = '<button type="button" class="gi-param-enter is-locked" data-gi-param-enter disabled>ENTRA IN GREED ISLAND</button><p class="gi-param-enter-note is-locked" data-gi-param-enter-note></p>';
      card.appendChild(wrap);
      wrap.querySelector('[data-gi-param-enter]').addEventListener('click', () => {
        if (lastCharacter?.ready && (lastCharacter.setupPoints || 0) <= 0) startWelcome(lastCharacter, 'slow');
      });
    }
    const left = c.setupPoints || 0;
    const btn = wrap.querySelector('[data-gi-param-enter]');
    const note = wrap.querySelector('[data-gi-param-enter-note]');
    btn.disabled = true;
    btn.classList.add('is-locked');
    note.classList.add('is-locked');
    note.textContent = `Punti rimasti: ${left}. Spendi tutti i 10 punti per entrare.`;
  };
  const renderReady = c => {
    const card = paramCard();
    if (!card || !c || localStorage.getItem(keyFor(c)) === '1') return;
    const params = c.params || {};
    card.innerHTML = `<h1>Scheda parametri</h1><p class="param-note">Punti iniziali rimasti: <strong>0</strong> / 10</p><div class="stat-list">${Object.entries(labels).map(([k,label]) => `<div class="gi-ready-row"><span>${label}</span><strong>${params[k] || 0}</strong></div>`).join('')}</div><div class="gi-param-enter-wrap" data-gi-param-enter-wrap><button type="button" class="gi-param-enter" data-gi-param-enter>ENTRA IN GREED ISLAND</button><p class="gi-param-enter-note">Parametri completati. Greed Island ti sta aspettando.</p></div>`;
    document.body.classList.add('has-param-setup');
    document.body.classList.remove('has-greed-profile');
    card.querySelector('[data-gi-param-enter]').addEventListener('click', () => startWelcome(c, 'slow'));
  };
  const handleCharacter = c => {
    if (!c || busy) return;
    lastCharacter = c;
    setTimeout(() => {
      if ((c.setupPoints || 0) > 0) renderLocked(c);
      else if (c.ready) renderReady(c);
    }, 60);
  };
  window.addEventListener('greed-character-updated', e => handleCharacter(e.detail));

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await originalFetch(...args);
    try {
      const url = String(args[0] || '');
      if (url.includes('/api/hxh-character')) {
        const clone = res.clone();
        clone.json().then(data => {
          const c = data?.character;
          if (c) handleCharacter(c);
        }).catch(() => {});
      }
    } catch {}
    return res;
  };
})();
