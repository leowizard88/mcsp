(() => {
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const api = async (body = null) => {
    const opts = body
      ? { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify(body), cache:'no-store' }
      : { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' };
    const res = await fetch('/api/hxh-explore', opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore esplorazione');
    return data;
  };
  const css = document.createElement('style');
  css.textContent = `
    .explore-modal{position:fixed;inset:0;z-index:210;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.66);backdrop-filter:blur(2px);padding:20px}.explore-modal.is-open{display:flex}.explore-card{width:min(460px,calc(100vw - var(--side,44px) - 40px));border:2px solid #dfff73;background:rgba(4,18,10,.96);box-shadow:8px 8px 0 rgba(0,0,0,.78);color:#f4ffe8;font-family:Arial,Helvetica,sans-serif;padding:18px}.explore-card h2{margin:0 0 10px;color:#ffe16a;font:900 30px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:3px 3px 0 #000}.explore-card p{margin:0 0 12px;font:700 14px/1.35 Arial,Helvetica,sans-serif}.explore-choice{display:grid;grid-template-columns:1fr 1fr;gap:9px}.explore-choice button,.explore-close,.explore-results-btn,.critical-die-btn{border:1px solid #dfff73;background:rgba(22,75,0,.95);color:#dfff73;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:11px 10px;cursor:pointer;box-shadow:3px 3px 0 #000}.explore-choice button:hover,.explore-results-btn:hover{background:rgba(45,120,0,.98)}.explore-close{margin-top:10px;background:#222;color:#fff;border-color:#fff}
    .explore-log-panel{position:fixed;right:18px;top:92px;z-index:118;width:min(560px,calc(100vw - var(--side,44px) - 38px));height:min(650px,calc(100vh - 122px));border:3px solid #dfff73;background:#061009;box-shadow:8px 8px 0 rgba(0,0,0,.85),0 0 34px rgba(120,255,60,.16);color:#f4ffe8;font-family:Arial,Helvetica,sans-serif;padding:0;display:none;overflow:hidden}.explore-log-panel.is-open{display:grid;grid-template-rows:auto auto 1fr auto}.explore-log-head{padding:12px 14px 8px;border-bottom:2px solid rgba(223,255,115,.65);background:linear-gradient(180deg,#11220e,#061009)}.explore-log-panel h2{margin:0;color:#ffe16a;font:900 30px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:3px 3px 0 #000}.explore-timer{font:900 30px/1 'Courier New',monospace;color:#dfff73;text-shadow:2px 2px 0 #000;margin:8px 0 0}.explore-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:10px 12px;background:#09170b;border-bottom:1px solid rgba(255,255,255,.16)}.explore-meta div{border:1px solid rgba(255,255,255,.22);background:#020603;padding:7px;font:800 12px/1.25 Arial,Helvetica,sans-serif}.explore-meta strong{display:block;color:#dfff73;font-size:10px;text-transform:uppercase}.explore-log-scroll{overflow-y:auto;overflow-x:hidden;padding:10px 12px;background:#030704;scrollbar-width:thin;scrollbar-color:#dfff73 #061009}.explore-log-scroll::-webkit-scrollbar{width:11px}.explore-log-scroll::-webkit-scrollbar-track{background:#061009}.explore-log-scroll::-webkit-scrollbar-thumb{background:#dfff73;border:2px solid #061009}.explore-log{display:grid;gap:6px}.explore-line{border-left:3px solid rgba(255,255,255,.28);background:#111811;padding:7px 8px;font:700 13px/1.35 Arial,Helvetica,sans-serif}.explore-line.good{border-left-color:#66ff86;color:#baffc6;background:#0a1c0d}.explore-line.bad{border-left-color:#ff5a5a;color:#ffb4b4;background:#20100f}.explore-line.system{border-left-color:#9ecbff;color:#cfe8ff;background:#0c1521}.explore-line time{opacity:.7;font-size:10px;margin-right:6px}.explore-foot{padding:10px 12px;border-top:1px solid rgba(255,255,255,.16);background:#071009}.explore-results-btn{width:100%;margin:0 0 8px}.explore-note{margin:0;color:#ffdf7b;font:800 12px/1.3 Arial,Helvetica,sans-serif}.critical-screen{position:fixed;inset:0;z-index:320;display:none;place-items:center;background:radial-gradient(circle at center,rgba(110,0,0,.92),rgba(0,0,0,.98) 62%);color:#fff;text-align:center;font-family:Arial,Helvetica,sans-serif;padding:22px}.critical-screen.is-active{display:grid}.critical-card{width:min(760px,calc(100vw - 34px));border:4px solid #ff3f3f;background:rgba(0,0,0,.74);box-shadow:0 0 0 8px #000,0 0 90px rgba(255,0,0,.42);padding:clamp(24px,5vw,52px)}.critical-card h1{margin:0 0 14px;color:#ff4747;font:900 clamp(44px,8vw,110px)/.88 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:4px 4px 0 #000}.critical-card p{margin:0 0 18px;color:#ffd0d0;font:900 16px/1.38 'Courier New',monospace;text-transform:uppercase}.critical-die-btn{background:#a50016;color:#fff;border-color:#ffd0d0;font-size:14px}.exploration-locked .map-label,.exploration-locked .location-actions button:not([data-loc-action="explore"]),.exploration-locked .side-menu button:not([data-panel="stat"]):not([data-panel="guide"]){filter:grayscale(1)!important;opacity:.46!important;pointer-events:none!important}@media(max-width:760px){.explore-log-panel{right:8px;top:76px;width:calc(100vw - var(--side,38px) - 18px);height:calc(100vh - 92px)}.explore-meta{grid-template-columns:1fr 1fr}.explore-choice{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  const modal = document.createElement('div');
  modal.className = 'explore-modal';
  modal.innerHTML = `<div class="explore-card"><h2>Esplora</h2><p>Scegli modalità. <strong>Sicura</strong>: Percezione riduce la probabilità nemici. <strong>Scoperta</strong>: rischio pieno.</p><div class="explore-choice"><button type="button" data-explore-mode="sicura">Sicura</button><button type="button" data-explore-mode="scoperta">Scoperta</button></div><button type="button" class="explore-close">Chiudi</button><p class="explore-note" data-explore-modal-note></p></div>`;
  document.body.appendChild(modal);
  const logPanel = document.createElement('aside');
  logPanel.className = 'explore-log-panel';
  logPanel.innerHTML = `<div class="explore-log-head"><h2>Log esplorazione</h2><div class="explore-timer" data-explore-timer>--:--</div></div><div class="explore-meta" data-explore-meta></div><div class="explore-log-scroll" data-explore-scroll><div class="explore-log" data-explore-log></div></div><div class="explore-foot"><button type="button" class="explore-results-btn" data-explore-results hidden>Vedi risultati esplorazione</button><p class="explore-note" data-explore-note></p></div>`;
  game.appendChild(logPanel);
  const scrollBox = logPanel.querySelector('[data-explore-scroll]');
  const critical = document.createElement('div');
  critical.className = 'critical-screen';
  critical.innerHTML = `<div class="critical-card"><h1>Stato critico</h1><p>Hai subito un trauma alla testa. Non puoi fare nulla. Usa una carta cura oppure muori.</p><button type="button" class="critical-die-btn" data-critical-die>Muori</button></div>`;
  document.body.appendChild(critical);
  let current = null;
  let poll = null;
  let userScrolled = false;
  const note = txt => { logPanel.querySelector('[data-explore-note]').textContent = txt || ''; };
  scrollBox.addEventListener('scroll', () => {
    userScrolled = scrollBox.scrollTop + scrollBox.clientHeight < scrollBox.scrollHeight - 24;
  });
  const render = data => {
    const exp = data?.exploration;
    current = exp;
    const active = !!exp && !exp.claimed && exp.status !== 'claimed';
    document.body.classList.toggle('exploration-locked', active && !exp.done && !exp.criticalNow);
    if (data?.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
    if (data?.character?.criticalState || exp?.criticalNow) {
      critical.classList.add('is-active');
      logPanel.classList.remove('is-open');
      modal.classList.remove('is-open');
      return;
    }
    critical.classList.remove('is-active');
    if (!exp || exp.status === 'claimed') {
      logPanel.classList.remove('is-open');
      return;
    }
    logPanel.classList.add('is-open');
    logPanel.querySelector('[data-explore-timer]').textContent = exp.done ? 'COMPLETATA' : fmt(exp.secondsLeft);
    logPanel.querySelector('[data-explore-meta]').innerHTML = `<div><strong>Zona</strong>${esc(exp.location)}</div><div><strong>Difficoltà</strong>${esc(exp.difficultyLabel || exp.difficulty)}</div><div><strong>Modalità</strong>${esc(exp.mode)}</div><div><strong>Nemici</strong>${esc(exp.enemyChance)}%</div>`;
    const rows = exp.visibleLogs || [];
    const oldBottom = scrollBox.scrollHeight - scrollBox.scrollTop;
    logPanel.querySelector('[data-explore-log]').innerHTML = rows.map(l => `<div class="explore-line ${esc(l.kind || 'info')}"><time>${fmt(l.atSec)}</time>${esc(l.text)}</div>`).join('');
    const btn = logPanel.querySelector('[data-explore-results]');
    btn.hidden = !exp.done;
    if (exp.done) note('Il timer è finito: puoi riscuotere o vedere i risultati.'); else note('Durante l’esplorazione non puoi muoverti o fare altre azioni.');
    if (userScrolled) scrollBox.scrollTop = Math.max(0, scrollBox.scrollHeight - oldBottom);
    else scrollBox.scrollTop = scrollBox.scrollHeight;
  };
  const refresh = async () => { try { render(await api()); } catch {} };
  const startPolling = () => {
    clearInterval(poll);
    poll = setInterval(refresh, 1000);
  };
  document.addEventListener('click', e => {
    const explore = e.target.closest('[data-loc-action="explore"]');
    if (!explore) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    modal.querySelector('[data-explore-modal-note]').textContent = '';
    modal.classList.add('is-open');
  }, true);
  modal.addEventListener('click', async e => {
    if (e.target === modal || e.target.closest('.explore-close')) modal.classList.remove('is-open');
    const b = e.target.closest('[data-explore-mode]');
    if (!b) return;
    b.disabled = true;
    try {
      const data = await api({ action:'start', mode:b.dataset.exploreMode });
      modal.classList.remove('is-open');
      userScrolled = false;
      render(data);
      startPolling();
    } catch (err) {
      modal.querySelector('[data-explore-modal-note]').textContent = err.message;
    } finally { b.disabled = false; }
  });
  logPanel.querySelector('[data-explore-results]').addEventListener('click', async () => {
    try {
      const data = await api({ action:'claim' });
      render(data);
      note('Ricompense riscosse.');
      setTimeout(() => logPanel.classList.remove('is-open'), 1600);
    } catch (err) { note(err.message); }
  });
  critical.querySelector('[data-critical-die]').addEventListener('click', async () => {
    if (!confirm('Morire eliminerà il personaggio. Continuare?')) return;
    try {
      await api({ action:'die' });
      localStorage.removeItem('greedEntered:player');
      location.href = '/greed-island/';
    } catch (err) { alert(err.message); }
  });
  window.addEventListener('greed-character-updated', e => {
    const c = e.detail || {};
    if (c.activeExploration || c.criticalState) refresh();
  });
  refresh();
  startPolling();
})();
