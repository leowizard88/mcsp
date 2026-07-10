(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const api = async body => {
    const res = await fetch('/api/hxh-explore', body ? {
      method:'POST',
      headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` },
      body:JSON.stringify(body),
      cache:'no-store'
    } : { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore esplorazione');
    return data;
  };
  const claimApi = async () => {
    const res = await fetch('/api/hxh-explore-claim', {
      method:'POST',
      headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` },
      body:JSON.stringify({ action:'claim' }),
      cache:'no-store'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore riscossione');
    return data;
  };
  const list = rows => Array.isArray(rows) && rows.length ? `<ul>${rows.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<span class="gi-res-empty">nessuno</span>';
  const kills = obj => {
    const entries = Object.entries(obj || {}).filter(([,v]) => Number(v) > 0);
    return entries.length ? `<ul>${entries.map(([k,v]) => `<li>${esc(k)} × ${esc(v)}</li>`).join('')}</ul>` : '<span class="gi-res-empty">nessuno</span>';
  };
  const fallbackSummary = exp => {
    const logs = exp?.logs || exp?.visibleLogs || [];
    const s = { killed:{}, jenny:0, exp:0, cardsGained:[], itemsGained:[], healthLost:0, cardsLost:[], itemsLost:[] };
    logs.forEach(l => {
      const t = String(l.text || '');
      const dead = t.match(/^(.+?) è esausto\. Ottenuti (\d+) EXP e (\d+) Jenny\./);
      if (dead) { s.killed[dead[1]] = (s.killed[dead[1]] || 0) + 1; s.exp += Number(dead[2]); s.jenny += Number(dead[3]); }
      const card = t.match(/^Ottenuta (.+)!$/);
      if (card) s.cardsGained.push(card[1]);
      const lost = t.match(/^Un furfante ti ha rubato la carta (.+)!$/);
      if (lost) s.cardsLost.push(lost[1]);
      const item = t.match(/^Modulo bonus: trovato (.+?) \(/);
      if (item) s.itemsGained.push(item[1]);
      const dmg = t.match(/: (\d+) danni entrati\.|preso (\d+) danni/);
      if (dmg) s.healthLost += Number(dmg[1] || dmg[2] || 0);
    });
    return s;
  };
  const css = document.createElement('style');
  css.textContent = `
    .gi-results-modal{position:fixed;inset:0;z-index:330;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(2px);padding:18px}.gi-results-modal.is-open{display:flex}.gi-results-card{width:min(720px,calc(100vw - var(--side,44px) - 34px));max-height:calc(100vh - 48px);overflow:auto;border:3px solid #dfff73;background:#071009;color:#f4ffe8;box-shadow:9px 9px 0 rgba(0,0,0,.82),0 0 42px rgba(120,255,60,.16);font-family:Arial,Helvetica,sans-serif;padding:18px}.gi-results-card h2{margin:0 0 14px;color:#ffe16a;font:900 34px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:3px 3px 0 #000}.gi-results-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gi-res-tile{border:1px solid rgba(255,255,255,.24);background:#101810;padding:10px;min-height:58px}.gi-res-tile strong{display:block;color:#dfff73;font:900 11px/1 'Courier New',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}.gi-res-tile b{font-size:22px;color:#fff}.gi-res-tile ul{margin:0;padding-left:18px;display:grid;gap:4px}.gi-res-empty{opacity:.62}.gi-results-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.gi-results-actions button{border:1px solid #dfff73;background:rgba(22,75,0,.96);color:#dfff73;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:11px 13px;cursor:pointer;box-shadow:3px 3px 0 #000}.gi-results-actions .gi-results-close{background:#222;color:#fff;border-color:#fff}.gi-results-error{color:#ffb0b0;font:800 13px/1.3 Arial,Helvetica,sans-serif;margin-top:10px}@media(max-width:760px){.gi-results-grid{grid-template-columns:1fr}.gi-results-card{width:calc(100vw - var(--side,38px) - 20px)}}
  `;
  document.head.appendChild(css);
  const modal = document.createElement('div');
  modal.className = 'gi-results-modal';
  modal.innerHTML = `<div class="gi-results-card"><h2>Risultati esplorazione</h2><div class="gi-results-grid" data-results-grid></div><div class="gi-results-actions"><button type="button" class="gi-results-close">Chiudi</button><button type="button" data-results-claim>Riscuoti e chiudi</button></div><div class="gi-results-error" data-results-error></div></div>`;
  document.body.appendChild(modal);
  const grid = modal.querySelector('[data-results-grid]');
  const err = modal.querySelector('[data-results-error]');
  const openSummary = exp => {
    const s = exp?.summary || fallbackSummary(exp);
    grid.innerHTML = `
      <div class="gi-res-tile"><strong>Nemici uccisi</strong>${kills(s.killed)}</div>
      <div class="gi-res-tile"><strong>Jenny ottenuti</strong><b>${esc(s.jenny || 0)} Ｊ</b></div>
      <div class="gi-res-tile"><strong>EXP ottenuti</strong><b>${esc(s.exp || 0)}</b></div>
      <div class="gi-res-tile"><strong>Carte ottenute</strong>${list(s.cardsGained)}</div>
      <div class="gi-res-tile"><strong>Oggetti ottenuti</strong>${list(s.itemsGained)}</div>
      <div class="gi-res-tile"><strong>Salute generale persa</strong><b>${esc(s.healthLost || 0)}</b></div>
      <div class="gi-res-tile"><strong>Carte perse</strong>${list(s.cardsLost)}</div>
      <div class="gi-res-tile"><strong>Oggetti persi</strong>${list(s.itemsLost)}</div>
    `;
    err.textContent = '';
    modal.classList.add('is-open');
  };
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-explore-results]');
    if (!btn || btn.hidden) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try {
      const data = await api();
      if (!data.exploration?.done) throw new Error('Esplorazione ancora in corso.');
      openSummary(data.exploration);
    } catch (ex) {
      err.textContent = ex.message;
      modal.classList.add('is-open');
    }
  }, true);
  modal.addEventListener('click', async e => {
    if (e.target === modal || e.target.closest('.gi-results-close')) modal.classList.remove('is-open');
    if (!e.target.closest('[data-results-claim]')) return;
    const btn = e.target.closest('[data-results-claim]');
    btn.disabled = true;
    try {
      const data = await claimApi();
      if (data.character) window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      modal.classList.remove('is-open');
      document.querySelector('.explore-log-panel')?.classList.remove('is-open');
    } catch (ex) {
      err.textContent = ex.message;
    } finally { btn.disabled = false; }
  });
})();
