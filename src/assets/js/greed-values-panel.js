(() => {
  const panel = document.querySelector('[data-menu-panel]');
  const nav = document.querySelector('.side-menu');
  if (!panel || !nav) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const css = document.createElement('style');
  css.textContent = `
    .values-section{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.38);padding:10px;margin:0 0 14px}.values-section h3{margin:0 0 8px;color:#dfff73;font:900 17px/1 'Courier New',monospace;text-transform:uppercase;letter-spacing:.06em}.values-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.value-tile{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.46);padding:9px}.value-tile strong{display:block;color:#ffe16a;text-transform:uppercase;font-size:11px;margin-bottom:4px}.value-tile span{font-weight:900;text-transform:uppercase}.value-tile small{display:block;margin-top:4px;color:#ffdf7b;font:700 11px/1.25 Arial,Helvetica,sans-serif;text-transform:none}@media(max-width:760px){.values-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);
  const readCharacter = async () => {
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    return data.character;
  };
  const render = c => {
    if (!c || !panel.querySelector('.stat-section')) return;
    panel.querySelector('.values-section')?.remove();
    const section = document.createElement('section');
    section.className = 'values-section';
    const vulnerabilita = c.vulnerabilityEffective || c.stats?.valori?.vulnerabilita || c.vulnerability || 'bassa';
    const sleepLine = c.sleepActive ? `<small>Dormi: vulnerabilità alta per ${fmt(c.sleepSecondsLeft)}.</small>` : '';
    section.innerHTML = `<h3>Valori</h3><div class="values-grid"><div class="value-tile"><strong>Vulnerabilità</strong><span>${vulnerabilita}</span>${sleepLine}</div></div>`;
    const firstStat = panel.querySelector('.stat-section');
    firstStat.before(section);
  };
  const refresh = async () => { try { render(await readCharacter()); } catch {} };
  nav.querySelector('[data-panel="stat"]')?.addEventListener('click', () => setTimeout(refresh, 120), true);
  window.addEventListener('greed-character-updated', e => setTimeout(() => render(e.detail), 60));
})();
