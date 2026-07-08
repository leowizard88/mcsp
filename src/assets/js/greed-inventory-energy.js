(() => {
  const panel = document.querySelector('[data-menu-panel]');
  const nav = document.querySelector('.side-menu');
  const locationBox = document.querySelector('.location-display');
  if (!panel || !nav) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  let currentCharacter = null;
  let lastFetch = 0;
  const getCharacter = async (force = false) => {
    const now = Date.now();
    if (!force && currentCharacter && now - lastFetch < 15000) return currentCharacter;
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    currentCharacter = data.character;
    lastFetch = now;
    return currentCharacter;
  };
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const css = document.createElement('style');
  css.textContent = `
    .inventory-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.inventory-list li{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.45);padding:10px 11px;color:#f4ffe8}.inventory-empty{color:#d9d9d9;font:400 14px/1.35 Arial,Helvetica,sans-serif}
    .location-display{max-width:230px!important}.energy-hud{position:fixed;left:calc(var(--side,44px) + 104px);z-index:30;color:#00e33a;font:800 14px/1.25 Arial,Helvetica,sans-serif;text-shadow:1px 1px 0 #000;white-space:nowrap}.energy-hud small{display:block;margin-top:2px;color:#dfff73;font:700 11px/1.25 Arial,Helvetica,sans-serif;text-transform:none}.stat-energy-timer{display:block;margin-top:4px;color:#dfff73;font:700 11px/1.25 Arial,Helvetica,sans-serif;text-transform:none}
    @media(max-width:760px){.energy-hud{left:calc(var(--side,38px) + 14px)}}
  `;
  document.head.appendChild(css);

  let energyHud = document.querySelector('[data-energy-hud]');
  if (!energyHud && locationBox) {
    energyHud = document.createElement('div');
    energyHud.className = 'energy-hud';
    energyHud.dataset.energyHud = '1';
    locationBox.after(energyHud);
  }
  const placeEnergyHud = () => {
    if (!energyHud || !locationBox) return;
    const r = locationBox.getBoundingClientRect();
    energyHud.style.top = `${Math.ceil(r.bottom + 6)}px`;
  };
  const maxEnergy = c => c?.stats?.generali?.energiaMax ?? c?.stats?.generali?.energia ?? c?.energy ?? 0;
  const curEnergy = c => c?.stats?.generali?.energia ?? c?.energy ?? 0;
  const timerText = c => {
    const cur = curEnergy(c);
    const max = maxEnergy(c);
    if (cur >= max) return 'energia full';
    const base = Date.parse(c?.energyUpdatedAt || c?.updatedAt || c?.createdAt || new Date().toISOString());
    if (!Number.isFinite(base)) return 'prossima energia: --:--';
    const next = base + 600000;
    const left = Math.max(0, next - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return `prossima energia: ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const renderEnergyHud = c => {
    if (!energyHud || !c) return;
    placeEnergyHud();
    energyHud.innerHTML = `Energia ${curEnergy(c)} / ${maxEnergy(c)}<small>${timerText(c)}</small>`;
  };

  if (!nav.querySelector('[data-panel="inventory"]')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.panel = 'inventory';
    b.textContent = 'Inventario';
    nav.insertBefore(b, nav.querySelector('[data-panel="guide"]'));
    b.addEventListener('click', async () => {
      try {
        const c = await getCharacter(true);
        const items = Array.isArray(c?.inventory) ? c.inventory : [];
        panel.innerHTML = `<h2>Inventario</h2>${items.length ? `<ul class="inventory-list">${items.map(item => `<li>${esc(item.name || item.nome || item)}</li>`).join('')}</ul>` : '<p class="inventory-empty">Inventario vuoto. Qui verranno conservati oggetti, carte e altri strumenti del giocatore.</p>'}`;
      } catch (err) {
        panel.innerHTML = `<h2>Inventario</h2><p class="inventory-empty">${esc(err.message)}</p>`;
      }
      panel.classList.add('is-active');
    });
  }
  const updateStatPanel = async (force = false) => {
    try {
      const c = await getCharacter(force);
      renderEnergyHud(c);
      window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:c }));
      const g = c?.stats?.generali || {};
      const tiles = [...panel.querySelectorAll('.stat-tile')];
      const setTile = (name, value, timer = '') => {
        const tile = tiles.find(t => t.querySelector('strong')?.textContent?.trim() === name);
        const span = tile?.querySelector('span');
        if (span) span.innerHTML = `${value}${timer ? `<small class="stat-energy-timer">${timer}</small>` : ''}`;
      };
      setTile('Energia', `${g.energia ?? c.energy ?? 0}/${g.energiaMax ?? g.energia ?? c.energy ?? 0}`, timerText(c));
      setTile('Nen', `${g.nen ?? 0}/${g.nenMax ?? g.nen ?? 0}`);
      setTile('Salute generale', `${g.saluteGenerale ?? 0}/${g.saluteGeneraleMax ?? g.saluteGenerale ?? 0}`);
    } catch {}
  };
  nav.querySelector('[data-panel="stat"]')?.addEventListener('click', () => setTimeout(() => updateStatPanel(true), 40), true);
  window.addEventListener('resize', placeEnergyHud);
  window.addEventListener('greed-character-updated', e => {
    if (e.detail) { currentCharacter = e.detail; lastFetch = Date.now(); renderEnergyHud(currentCharacter); }
    setTimeout(() => updateStatPanel(true), 50);
  });
  setInterval(() => updateStatPanel(false), 1000);
  setTimeout(() => updateStatPanel(true), 700);
  import('/assets/js/greed-location-panel.js?v=20260708-locationpanel-1');
  import('/assets/js/greed-entry-gate.js?v=20260708-entrygate-1');
  import('/assets/js/greed-delete-confirm.js?v=20260708-deleteconfirm-1');
})();
