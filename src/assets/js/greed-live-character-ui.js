(() => {
  const clamp = v => Math.max(0, Math.floor(Number(v) || 0));
  const avg = arr => arr.length ? Math.ceil(arr.reduce((a,b) => a + b, 0) / arr.length) : 0;
  const healthBase = { testa:5, corpo:8, braccioDx:6, braccioSx:6, gambaDx:7, gambaSx:7 };
  const healthLabels = { testa:'Testa', corpo:'Corpo', braccioDx:'Braccio dx', braccioSx:'Braccio sx', gambaDx:'Gamba dx', gambaSx:'Gamba sx' };
  const maxEnergyFor = level => 3 + ((clamp(level || 1) - 1) * 2);
  const nextXpFor = level => {
    let n = 10;
    for (let i = 1; i < clamp(level || 1); i++) n += Math.ceil(n / 2);
    return n;
  };
  const healthMax = (c, key) => {
    const fromStats = c?.stats?.saluteMax?.[key];
    if (fromStats != null) return clamp(fromStats);
    const p = c?.paramsEffective || c?.params || {};
    return (healthBase[key] || 0) + clamp(p.robustezza) * 2 + Math.max(0, clamp(c?.level || 1) - 1);
  };
  const healthCur = (c, key) => clamp(c?.stats?.salute?.[key] ?? c?.health?.[key] ?? healthMax(c, key));
  const setTile = (name, value) => {
    const tiles = [...document.querySelectorAll('.stat-tile')];
    const tile = tiles.find(t => t.querySelector('strong')?.textContent?.trim() === name);
    const span = tile?.querySelector('span');
    if (span) span.textContent = value;
  };
  const sync = c => {
    if (!c) return;
    const g = c.stats?.generali || {};
    const level = clamp(g.livello ?? c.level ?? 1);
    const xp = clamp(g.esperienza ?? c.xp ?? 0);
    const nextXp = clamp(g.prossimoLivello ?? c.nextXp ?? nextXpFor(level));
    const jenny = clamp(g.jenny ?? c.jenny ?? 0);
    const paramPoints = clamp(g.puntiParametro ?? c.paramPoints ?? 0);
    const energy = clamp(g.energia ?? c.energy ?? 0);
    const energyMax = clamp(g.energiaMax ?? maxEnergyFor(level));
    const healthKeys = Object.keys(healthBase);
    const healthGeneral = clamp(g.saluteGenerale ?? avg(healthKeys.map(k => healthCur(c, k))));
    const healthGeneralMax = clamp(g.saluteGeneraleMax ?? avg(healthKeys.map(k => healthMax(c, k))));

    const levelLabel = document.querySelector('[data-level-label]');
    if (levelLabel) levelLabel.textContent = String(level);
    const jennyLabel = document.querySelector('[data-jenny-label]');
    if (jennyLabel) jennyLabel.textContent = String(jenny);
    const energyHud = document.querySelector('[data-energy-hud]');
    if (energyHud) energyHud.firstChild && (energyHud.firstChild.textContent = `Energia ${energy} / ${energyMax}`);

    setTile('Livello', String(level));
    setTile('Esperienza', `${xp} / ${nextXp}`);
    setTile('Punti parametro', String(paramPoints));
    setTile('Jenny', `${jenny} Ｊ`);
    setTile('Energia', `${energy}/${energyMax}`);
    setTile('Salute generale', `${healthGeneral}/${healthGeneralMax}`);
    Object.entries(healthLabels).forEach(([key, label]) => setTile(label, `${healthCur(c, key)} / ${healthMax(c, key)}`));
  };
  window.addEventListener('greed-character-updated', event => sync(event.detail));
})();
