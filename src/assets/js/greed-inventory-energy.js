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
  const postAction = async action => {
    const res = await fetch('/api/hxh-character', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ action }), cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    currentCharacter = data.character;
    lastFetch = Date.now();
    window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
    return data.character;
  };
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const css = document.createElement('style');
  css.textContent = `
    .inventory-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}.inventory-list li{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.45);padding:10px 11px;color:#f4ffe8}.inventory-empty{color:#d9d9d9;font:400 14px/1.35 Arial,Helvetica,sans-serif}
    .location-display{max-width:230px!important}.energy-hud{position:fixed;left:calc(var(--side,44px) + 104px);z-index:30;color:#00e33a;font:800 14px/1.25 Arial,Helvetica,sans-serif;text-shadow:1px 1px 0 #000;white-space:nowrap}.energy-hud small{display:block;margin-top:2px;color:#dfff73;font:700 11px/1.25 Arial,Helvetica,sans-serif;text-transform:none}.stat-energy-timer{display:block;margin-top:4px;color:#dfff73;font:700 11px/1.25 Arial,Helvetica,sans-serif;text-transform:none}.rest-stat-note{border:1px solid rgba(255,176,176,.7);background:rgba(90,0,0,.45);color:#ffb0b0;padding:9px 10px;margin:0 0 12px;font:900 13px/1.35 Arial,Helvetica,sans-serif}.param-penalty{display:block;margin-top:3px;color:#ffb0b0;font:800 11px/1.2 Arial,Helvetica,sans-serif}.collapse-button{border:2px solid #ffd0d0;background:#b0001b;color:#fff;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:9px 10px;cursor:pointer;box-shadow:3px 3px 0 #000;margin-left:8px}.collapse-button:hover{background:#e00022}.exhaustion-screen{position:fixed;inset:0;z-index:300;background:radial-gradient(circle at center,rgba(90,0,0,.92),rgba(0,0,0,.98) 62%);display:none;place-items:center;text-align:center;color:#fff;font-family:Arial,Helvetica,sans-serif;pointer-events:auto}.exhaustion-screen.is-active{display:grid}.exhaustion-box{border:4px solid #ff4747;background:rgba(0,0,0,.74);box-shadow:0 0 0 8px rgba(0,0,0,.9),0 0 80px rgba(255,0,0,.44);padding:clamp(26px,6vw,70px);width:min(850px,calc(100vw - 34px))}.exhaustion-box h1{margin:0 0 18px;color:#ff4747;font:900 clamp(44px,9vw,130px)/.85 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase;text-shadow:4px 4px 0 #000}.exhaustion-timer{font:900 clamp(50px,10vw,150px)/1 'Courier New',monospace;color:#fff;text-shadow:0 0 26px rgba(255,255,255,.8),5px 5px 0 #000}.exhaustion-box p{margin:14px 0 0;font:900 16px/1.35 'Courier New',monospace;color:#ffd0d0;text-transform:uppercase}
    @media(max-width:760px){.energy-hud{left:calc(var(--side,38px) + 14px)}}
  `;
  document.head.appendChild(css);

  const exhaustionScreen = document.createElement('div');
  exhaustionScreen.className = 'exhaustion-screen';
  exhaustionScreen.innerHTML = '<div class="exhaustion-box"><h1>Esaurimento</h1><div class="exhaustion-timer" data-exhaustion-timer>10:00</div><p>Sei collassato a terra. Ogni attività è bloccata finché non ti riprendi.</p></div>';
  document.body.appendChild(exhaustionScreen);
  const updateExhaustionScreen = c => {
    const active = !!c?.exhaustionActive && (c.exhaustionSecondsLeft || 0) > 0;
    exhaustionScreen.classList.toggle('is-active', active);
    if (active) exhaustionScreen.querySelector('[data-exhaustion-timer]').textContent = fmt(c.exhaustionSecondsLeft);
  };

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
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
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
    return `prossima energia: ${fmt(Math.ceil(left / 1000))}`;
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
  const patchStatPanel = c => {
    if (!c) return;
    renderEnergyHud(c);
    updateExhaustionScreen(c);
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
    let statoValue = `${c.fatigueLabel || g.stato || 'Normale'} (${c.fatigue || 0}/30)`;
    if (c.energySurcharge > 0) statoValue += `<small class="stat-energy-timer">costo energia +${c.energySurcharge}</small>`;
    if ((c.fatigue || 0) >= 30 && !c.exhaustionActive) statoValue += `<button type="button" class="collapse-button" data-collapse-ground>Collassa a terra</button>`;
    let statoTile = tiles.find(t => t.querySelector('strong')?.textContent?.trim() === 'Stato');
    if (!statoTile) {
      const grid = panel.querySelector('.stat-mini-grid');
      if (grid) {
        statoTile = document.createElement('div');
        statoTile.className = 'stat-tile';
        statoTile.innerHTML = '<strong>Stato</strong><span></span>';
        grid.appendChild(statoTile);
      }
    }
    const statoSpan = statoTile?.querySelector('span');
    if (statoSpan) statoSpan.innerHTML = statoValue;
    statoTile?.querySelector('[data-collapse-ground]')?.addEventListener('click', async () => {
      try { patchStatPanel(await postAction('collapse')); } catch (err) { alert(err.message); }
    });
    panel.querySelector('.rest-stat-note')?.remove();
    panel.querySelector('.rest-cooldown-note')?.remove();
    if (c?.exhaustionSecondsLeft > 0) {
      const ex = document.createElement('div');
      ex.className = 'rest-stat-note';
      ex.textContent = `Esaurimento: inattivo per ${fmt(c.exhaustionSecondsLeft)}. Alla fine energia piena e stato azzerato.`;
      panel.querySelector('.stat-section')?.before(ex);
    }
    if (c?.restPenaltySecondsLeft > 0) {
      const note = document.createElement('div');
      note.className = 'rest-stat-note';
      note.textContent = `Riposo attivo: -1 a tutti i parametri per ${fmt(c.restPenaltySecondsLeft)}.`;
      panel.querySelector('.stat-section')?.before(note);
      const labels = { forza:'Forza', robustezza:'Robustezza', nen:'Nen', intelligenza:'Intelligenza', malizia:'Malizia', agilita:'Agilità', oratoria:'Oratoria', percezione:'Percezione' };
      Object.entries(labels).forEach(([key,label]) => {
        const row = [...panel.querySelectorAll('.stat-row')].find(r => r.querySelector('span:first-child')?.textContent?.trim() === label);
        const val = row?.querySelector('.stat-value');
        if (val && c.paramsEffective && c.params) val.innerHTML = `${c.paramsEffective[key] ?? 0}<small class="param-penalty">base ${c.params[key] ?? 0}, riposo -1</small>`;
      });
    }
    if (c?.restCooldownSecondsLeft > 0) {
      const cd = document.createElement('div');
      cd.className = 'rest-stat-note rest-cooldown-note';
      cd.textContent = `Prossimo riposo disponibile tra ${fmt(c.restCooldownSecondsLeft)}.`;
      panel.querySelector('.stat-section')?.before(cd);
    }
  };
  const updateStatPanel = async (force = false) => {
    try { patchStatPanel(await getCharacter(force)); } catch {}
  };
  nav.querySelector('[data-panel="stat"]')?.addEventListener('click', () => setTimeout(() => updateStatPanel(true), 40), true);
  window.addEventListener('resize', placeEnergyHud);
  window.addEventListener('greed-character-updated', e => {
    if (e.detail) { currentCharacter = e.detail; lastFetch = Date.now(); patchStatPanel(currentCharacter); }
  });
  setInterval(() => {
    if (currentCharacter?.exhaustionSecondsLeft > 0) {
      currentCharacter.exhaustionSecondsLeft = Math.max(0, currentCharacter.exhaustionSecondsLeft - 1);
      updateExhaustionScreen(currentCharacter);
      if (currentCharacter.exhaustionSecondsLeft <= 0) updateStatPanel(true);
    }
    updateStatPanel(false);
  }, 1000);
  setTimeout(() => updateStatPanel(true), 700);
  import('/assets/js/greed-location-panel-stable.js?v=20260708-locationstable-2');
  import('/assets/js/greed-entry-gate.js?v=20260708-entrygate-safe-2');
  import('/assets/js/greed-delete-confirm.js?v=20260708-deleteconfirm-1');
  import('/assets/js/greed-binder-book.js?v=20260708-binder-1');
})();
