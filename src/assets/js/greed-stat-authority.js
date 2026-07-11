(() => {
  if (window.__greedStatAuthority) return;
  window.__greedStatAuthority = true;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const panel = () => document.querySelector('[data-menu-panel]');
  const clamp = v => Math.max(0, Math.floor(Number(v) || 0));
  const healthLabels = { testa:'Testa', corpo:'Corpo', braccioDx:'Braccio dx', braccioSx:'Braccio sx', gambaDx:'Gamba dx', gambaSx:'Gamba sx' };
  const paramLabels = { forza:'Forza', robustezza:'Robustezza', nen:'Nen', intelligenza:'Intelligenza', malizia:'Malizia', agilita:'Agilità', oratoria:'Oratoria', percezione:'Percezione' };
  let current = window.__greedCurrentCharacter || null;
  let fetching = false;
  let lastFetch = 0;
  let renderLock = false;
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const g = c => c?.stats?.generali || {};
  const setText = (sel, value) => { const el = document.querySelector(sel); if (el) el.textContent = value; };
  const tile = name => [...(panel()?.querySelectorAll('.stat-tile') || [])].find(t => t.querySelector('strong')?.textContent?.trim() === name);
  const setTile = (name, html) => {
    const span = tile(name)?.querySelector('span');
    if (span && span.innerHTML !== html) span.innerHTML = html;
  };
  const paramRow = label => [...(panel()?.querySelectorAll('.stat-row') || [])].find(r => r.querySelector('span:first-child')?.textContent?.trim() === label);
  const healthCur = (c, k) => clamp(c?.stats?.salute?.[k] ?? c?.health?.[k]);
  const healthMax = (c, k) => clamp(c?.stats?.saluteMax?.[k] ?? c?.health?.[k]);
  const avg = obj => {
    const vals = Object.values(obj || {}).map(clamp);
    return vals.length ? Math.ceil(vals.reduce((a,b) => a + b, 0) / vals.length) : 0;
  };
  const restNote = c => {
    if (c?.exhaustionSecondsLeft > 0) return `Esaurimento: inattivo per ${fmt(c.exhaustionSecondsLeft)}. Alla fine energia piena e stato azzerato.`;
    if (c?.restPenaltySecondsLeft > 0) return `Riposo attivo: -1 a tutti i parametri per ${fmt(c.restPenaltySecondsLeft)}.`;
    if (c?.restCooldownSecondsLeft > 0) return `Prossimo riposo disponibile tra ${fmt(c.restCooldownSecondsLeft)}.`;
    return '';
  };
  const ensureNote = (c) => {
    const p = panel();
    if (!p || p.querySelector('h2')?.textContent?.trim() !== 'STAT') return;
    p.querySelectorAll('.rest-stat-note,.rest-cooldown-note').forEach(n => n.remove());
    const txt = restNote(c);
    if (!txt) return;
    const n = document.createElement('div');
    n.className = 'rest-stat-note';
    n.textContent = txt;
    p.querySelector('.stat-section')?.before(n);
  };
  const render = c => {
    if (!c || renderLock) return;
    current = c;
    renderLock = true;
    requestAnimationFrame(() => {
      const gen = g(c);
      const level = clamp(gen.livello ?? c.level ?? 1);
      const energy = clamp(gen.energia ?? c.energy);
      const energyMax = clamp(gen.energiaMax ?? energy);
      const xp = clamp(gen.esperienza ?? c.xp);
      const nextXp = clamp(gen.prossimoLivello ?? c.nextXp);
      const jenny = clamp(gen.jenny ?? c.jenny);
      const hp = c.stats?.salute || c.health || {};
      const hpMax = c.stats?.saluteMax || hp;
      setText('[data-level-label]', String(level));
      setText('[data-jenny-label]', String(jenny));
      const hud = document.querySelector('[data-energy-hud]');
      if (hud) hud.innerHTML = `Energia ${energy} / ${energyMax}<small>${energy >= energyMax ? 'energia full' : (hud.querySelector('small')?.textContent || '')}</small>`;
      if (panel()?.querySelector('h2')?.textContent?.trim() === 'STAT') {
        setTile('Livello', String(level));
        setTile('Esperienza', `${xp} / ${nextXp}`);
        setTile('Punti parametro', String(clamp(gen.puntiParametro ?? c.paramPoints)));
        setTile('Jenny', `${jenny} Ｊ`);
        setTile('Energia', `${energy}/${energyMax}`);
        setTile('Nen', `${clamp(gen.nen)} / ${clamp(gen.nenMax ?? gen.nen)}`);
        setTile('Salute generale', `${clamp(gen.saluteGenerale ?? avg(hp))}/${clamp(gen.saluteGeneraleMax ?? avg(hpMax))}`);
        Object.entries(healthLabels).forEach(([k,label]) => setTile(label, `${healthCur(c,k)} / ${healthMax(c,k)}`));
        Object.entries(paramLabels).forEach(([k,label]) => {
          const row = paramRow(label);
          const val = row?.querySelector('.stat-value');
          if (!val) return;
          const base = clamp(c.params?.[k]);
          const eff = clamp(c.paramsEffective?.[k] ?? base);
          val.innerHTML = eff === base ? String(base) : `${eff}<small class="param-penalty">base ${base}, riposo -1</small>`;
        });
        ensureNote(c);
      }
      renderLock = false;
    });
  };
  const fetchCharacter = async (force = false) => {
    if (fetching) return current;
    if (!force && Date.now() - lastFetch < 1600) return current;
    fetching = true;
    try {
      await fetch('/api/hxh-sync', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:'{}', cache:'no-store' }).catch(() => null);
      const res = await fetch(`/api/hxh-character?statAuthority=${Date.now()}`, { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.character) {
        current = data.character;
        window.greedPublishCharacter?.(data.character, 'character');
        render(data.character);
      }
    } finally {
      lastFetch = Date.now();
      fetching = false;
    }
    return current;
  };
  window.addEventListener('greed-character-updated', e => render(e.detail));
  window.addEventListener('greed-rested-authoritative', e => { current = e.detail || current; fetchCharacter(true); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-panel="stat"]')) setTimeout(() => fetchCharacter(true), 20);
  }, true);
  const obs = new MutationObserver(() => {
    if (panel()?.querySelector('h2')?.textContent?.trim() === 'STAT') {
      if (current) render(current);
      fetchCharacter(false);
    }
  });
  const start = () => { const p = panel(); if (p) obs.observe(p, { childList:true, subtree:true, characterData:true }); };
  start();
  setInterval(() => {
    if (document.body.classList.contains('has-greed-profile')) fetchCharacter(false);
    else if (current) render(current);
  }, 2000);
  setTimeout(() => fetchCharacter(true), 800);
})();
