(() => {
  const clamp = v => Math.max(0, Math.floor(Number(v) || 0));
  const maxEnergyFor = level => 3 + ((clamp(level || 1) - 1) * 2);
  const nextXpFor = level => {
    let n = 10;
    for (let i = 1; i < clamp(level || 1); i++) n += Math.ceil(n / 2);
    return n;
  };
  const setPlainTile = (name, value) => {
    const tiles = [...document.querySelectorAll('.stat-tile')];
    const tile = tiles.find(t => t.querySelector('strong')?.textContent?.trim() === name);
    const span = tile?.querySelector('span');
    if (span && !span.querySelector('small,button')) span.textContent = value;
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

    const levelLabel = document.querySelector('[data-level-label]');
    if (levelLabel) levelLabel.textContent = String(level);
    const jennyLabel = document.querySelector('[data-jenny-label]');
    if (jennyLabel) jennyLabel.textContent = String(jenny);
    const energyHud = document.querySelector('[data-energy-hud]');
    if (energyHud?.firstChild) energyHud.firstChild.textContent = `Energia ${energy} / ${energyMax}`;

    setPlainTile('Livello', String(level));
    setPlainTile('Esperienza', `${xp} / ${nextXp}`);
    setPlainTile('Punti parametro', String(paramPoints));
    setPlainTile('Jenny', `${jenny} Ｊ`);
  };
  window.addEventListener('greed-character-updated', event => sync(event.detail));
})();
