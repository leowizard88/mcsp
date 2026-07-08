(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const relabel = () => {
    const buttons = [...document.querySelectorAll('[data-explore-mode]')];
    if (buttons[0]) {
      buttons[0].dataset.exploreMode = 'scoperta';
      buttons[0].textContent = 'Scoperta';
    }
    if (buttons[1]) {
      buttons[1].dataset.exploreMode = 'zetsu';
      buttons[1].textContent = 'Zetsu attivo';
    }
    document.querySelectorAll('.explore-card p').forEach(p => {
      p.innerHTML = 'Scegli modalità. <strong>Scoperta</strong>: probabilità nemici standard della zona. <strong>Zetsu attivo</strong>: Nen riduce la probabilità nemici.';
    });
  };
  const logNumber = log => {
    const m = String(log?.id || '').match(/^log-(\d+)-/);
    return m ? Number(m[1]) : 0;
  };
  const sortLogs = logs => Array.isArray(logs)
    ? [...logs].sort((a,b) => (Number(a.atSec || 0) - Number(b.atSec || 0)) || (logNumber(a) - logNumber(b)))
    : logs;
  const patchExploration = data => {
    if (!data?.exploration) return data;
    const e = data.exploration;
    if (e.mode === 'scoperta') e.mode = 'Scoperta';
    if (e.mode === 'zetsu') e.mode = 'Zetsu attivo';
    if (e.modeLabel) e.mode = e.modeLabel;
    e.logs = sortLogs(e.logs);
    e.visibleLogs = sortLogs(e.visibleLogs);
    return data;
  };
  const healthLabels = { testa:'Testa', corpo:'Corpo', braccioDx:'Braccio dx', braccioSx:'Braccio sx', gambaDx:'Gamba dx', gambaSx:'Gamba sx' };
  const findTile = label => [...document.querySelectorAll('.stat-tile')].find(t => t.querySelector('strong')?.textContent?.trim().toLowerCase() === label.toLowerCase());
  const writeTile = (label, value) => {
    const tile = findTile(label);
    const span = tile?.querySelector('span');
    if (span && value !== undefined && value !== null) span.textContent = value;
  };
  const mirrorCharacter = c => {
    if (!c) return;
    const level = document.querySelector('[data-level-label]');
    const jenny = document.querySelector('[data-jenny-label]');
    if (level) level.textContent = c.level ?? 1;
    if (jenny) jenny.textContent = c.jenny ?? 0;
    writeTile('Livello', c.stats?.generali?.livello ?? c.level);
    writeTile('Esperienza', `${c.stats?.generali?.esperienza ?? c.xp ?? 0} / ${c.stats?.generali?.prossimoLivello ?? c.nextXp ?? ''}`);
    writeTile('Punti parametro', c.stats?.generali?.puntiParametro ?? c.paramPoints);
    writeTile('Jenny', `${c.jenny || 0} Ｊ`);
    if (c.stats?.generali?.saluteGenerale !== undefined) writeTile('Salute generale', `${c.stats.generali.saluteGenerale}/${c.stats.generali.saluteGeneraleMax ?? c.stats.generali.saluteGenerale}`);
    const h = c.health || {};
    Object.entries(healthLabels).forEach(([key,label]) => {
      const value = c.stats?.salute?.[key] ?? h[key];
      if (value !== undefined) writeTile(label, value);
    });
  };
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const res = await originalFetch(input, init);
    if (!url.includes('/api/hxh-explore')) return res;
    try {
      const clone = res.clone();
      const data = patchExploration(await clone.json());
      if (data?.character) {
        mirrorCharacter(data.character);
        window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      }
      return new Response(JSON.stringify(data), { status:res.status, statusText:res.statusText, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
    } catch { return res; }
  };
  let syncing = false;
  const liveSync = async () => {
    if (syncing) return;
    syncing = true;
    try {
      const res = await originalFetch('/api/hxh-explore-live-sync', { method:'POST', headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = patchExploration(await res.json().catch(() => ({})));
      if (data?.character) {
        mirrorCharacter(data.character);
        window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      }
    } catch {} finally { syncing = false; }
  };
  document.addEventListener('click', () => setTimeout(relabel, 20), true);
  window.addEventListener('greed-character-updated', e => mirrorCharacter(e.detail));
  new MutationObserver(relabel).observe(document.body, { childList:true, subtree:true });
  setInterval(liveSync, 1000);
  setTimeout(relabel, 250);
  setTimeout(liveSync, 1200);
})();
