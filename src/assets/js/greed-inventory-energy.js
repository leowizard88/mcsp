(() => {
  const panel = document.querySelector('[data-menu-panel]');
  const nav = document.querySelector('.side-menu');
  if (!panel || !nav) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const getCharacter = async () => {
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    return data.character;
  };
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const css = document.createElement('style');
  css.textContent = `
    .inventory-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.inventory-list li{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.45);padding:10px 11px;color:#f4ffe8}.inventory-empty{color:#d9d9d9;font:400 14px/1.35 Arial,Helvetica,sans-serif}
  `;
  document.head.appendChild(css);
  if (!nav.querySelector('[data-panel="inventory"]')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.panel = 'inventory';
    b.textContent = 'Inventario';
    nav.insertBefore(b, nav.querySelector('[data-panel="guide"]'));
    b.addEventListener('click', async () => {
      try {
        const c = await getCharacter();
        const items = Array.isArray(c?.inventory) ? c.inventory : [];
        panel.innerHTML = `<h2>Inventario</h2>${items.length ? `<ul class="inventory-list">${items.map(item => `<li>${esc(item.name || item.nome || item)}</li>`).join('')}</ul>` : '<p class="inventory-empty">Inventario vuoto. Qui verranno conservati oggetti, carte e altri strumenti del giocatore.</p>'}`;
      } catch (err) {
        panel.innerHTML = `<h2>Inventario</h2><p class="inventory-empty">${esc(err.message)}</p>`;
      }
      panel.classList.add('is-active');
    });
  }
  const updateStatPanel = async () => {
    try {
      const c = await getCharacter();
      window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:c }));
      const g = c?.stats?.generali || {};
      const tiles = [...panel.querySelectorAll('.stat-tile')];
      const setTile = (name, value) => {
        const tile = tiles.find(t => t.querySelector('strong')?.textContent?.trim() === name);
        const span = tile?.querySelector('span');
        if (span) span.textContent = value;
      };
      setTile('Energia', `${g.energia ?? c.energy ?? 0}/${g.energiaMax ?? g.energia ?? c.energy ?? 0}`);
      setTile('Nen', `${g.nen ?? 0}/${g.nenMax ?? g.nen ?? 0}`);
      setTile('Salute generale', `${g.saluteGenerale ?? 0}/${g.saluteGeneraleMax ?? g.saluteGenerale ?? 0}`);
    } catch {}
  };
  nav.querySelector('[data-panel="stat"]')?.addEventListener('click', () => setTimeout(updateStatPanel, 40), true);
  window.addEventListener('greed-character-updated', () => setTimeout(updateStatPanel, 50));
  setInterval(updateStatPanel, 60000);
  import('/assets/js/greed-location-panel.js?v=20260708-locationpanel-1');
})();
