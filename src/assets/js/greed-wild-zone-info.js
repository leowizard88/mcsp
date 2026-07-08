(() => {
  const WILD = new Set(['Foresta Oscura','Villaggio di banditi','Badlands','Rovine infestate','Plateau Bye Bye']);
  const DIFFICULTY = {
    'Foresta Oscura':{ label:'Nabbo', base:5, energy:1, enemy:30 }
  };
  let character = null;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const params = () => ({ forza:0, robustezza:0, nen:0, intelligenza:0, malizia:0, agilita:0, oratoria:0, percezione:0, ...(character?.paramsEffective || character?.params || {}) });
  const readCharacter = async () => {
    try {
      const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (data?.character) character = data.character;
    } catch {}
  };
  const currentLocationName = () => {
    const title = document.querySelector('.location-panel h2,.location-panel-title,[data-loc-title],.city-popup.is-open h2')?.textContent?.trim();
    if (title) return title;
    return document.querySelector('[data-location-label]')?.textContent?.trim() || '';
  };
  const panel = () => document.querySelector('.location-panel,.city-popup.is-open');
  const render = async () => {
    await readCharacter();
    const box = panel();
    if (!box) return;
    const place = currentLocationName();
    if (!WILD.has(place)) { box.querySelector('.wild-explore-info')?.remove(); return; }
    const d = DIFFICULTY[place] || { label:'Da definire', base:5, energy:1, enemy:0 };
    const p = params();
    const agi = Math.max(0, Math.floor(Number(p.agilita) || 0));
    const nen = Math.max(0, Math.floor(Number(p.nen) || 0));
    const effective = Math.max(5, d.base - agi);
    const zetsuEnemy = Math.max(10, d.enemy - nen * 2);
    let info = box.querySelector('.wild-explore-info');
    if (!info) {
      info = document.createElement('div');
      info.className = 'wild-explore-info';
      const target = box.querySelector('.location-actions,.city-actions') || box.lastElementChild;
      if (target) target.before(info); else box.appendChild(info);
    }
    info.innerHTML = `
      <strong>Esplorazione</strong>
      <span>Tempo: <b>${effective} min</b> <small>base ${d.base} - Agilità ${agi}, minimo 5</small></span>
      <span>Costo: <b>${d.energy} energia</b></span>
      <span>Difficoltà: <b>${esc(d.label)}</b></span>
      <span>Nemici: <b>${d.enemy}%</b> Scoperta <small>standard della zona, senza modificatori</small></span>
      <span>Nemici: <b>${zetsuEnemy}%</b> Zetsu attivo <small>Nen ${nen}</small></span>
    `;
  };
  const css = document.createElement('style');
  css.textContent = `.wild-explore-info{margin:12px 0;border:1px solid rgba(223,255,115,.72);background:rgba(0,0,0,.48);color:#f4ffe8;padding:10px;display:grid;gap:6px;font:800 12px/1.25 Arial,Helvetica,sans-serif}.wild-explore-info strong{color:#dfff73;text-transform:uppercase;font:900 12px/1 'Courier New',monospace;letter-spacing:.06em}.wild-explore-info b{color:#ffe16a}.wild-explore-info small{display:block;color:#bfe8a0;font-weight:700;margin-top:2px}`;
  document.head.appendChild(css);
  document.addEventListener('click', e => {
    if (e.target.closest('.map-label,[data-place],[data-loc-action],[data-city-enter]')) setTimeout(render, 180);
  }, true);
  window.addEventListener('greed-character-updated', e => { character = e.detail || character; setTimeout(render, 60); });
  const mo = new MutationObserver(() => setTimeout(render, 80));
  mo.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  setTimeout(render, 900);
})();
