(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const authHeaders = () => ({ 'content-type': 'application/json', authorization: `Bearer ${token()}` });
  const form = document.querySelector('[data-greed-form]');
  const creationCard = form?.closest('.greed-card');
  creationCard?.classList.add('creation-card');
  const del = document.querySelector('[data-delete-character]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-menu-panel]');
  const nav = document.querySelector('.side-menu');
  const cityPopup = document.querySelector('[data-city-popup]');
  const cityTitle = document.querySelector('[data-city-title]');
  const cityInfo = document.querySelector('[data-city-info]');
  const cityEnter = document.querySelector('[data-city-enter]');
  const locationLabel = document.querySelector('[data-location-label]');
  let levelLabel = document.querySelector('[data-level-label]');
  if (!levelLabel && locationLabel) {
    const box = document.createElement('div');
    box.className = 'level-display';
    box.innerHTML = 'Livello: <strong data-level-label>1</strong>';
    locationLabel.closest('.location-display')?.after(box);
    levelLabel = box.querySelector('[data-level-label]');
  }
  const game = document.querySelector('[data-greed-game]');
  const welcome = document.createElement('div');
  welcome.className = 'hxh-welcome';
  welcome.innerHTML = 'Benvenuto <strong data-hxh-name>giocatore</strong>!';
  const testLevel = document.createElement('button');
  testLevel.type = 'button';
  testLevel.className = 'test-levelup';
  testLevel.textContent = 'Level-up test';
  game?.appendChild(welcome);
  game?.appendChild(testLevel);
  const welcomeName = welcome.querySelector('[data-hxh-name]');
  let state = { user: null, character: null };
  let selectedPlace = '';
  const paramLabels = { forza:'Forza', robustezza:'Robustezza', nen:'Nen', intelligenza:'Intelligenza', malizia:'Malizia', agilita:'Agilità', oratoria:'Oratoria', percezione:'Percezione' };
  const healthLabels = { testa:'Testa', corpo:'Corpo', braccioDx:'Braccio dx', braccioSx:'Braccio sx', gambaDx:'Gamba dx', gambaSx:'Gamba sx' };
  const placeTypes = { Masadora:'city', Aiai:'city', Soufrabi:'city', Antokiba:'city', Dorias:'city', Rubicuta:'city', Limeiro:'city', Bunzen:'city', 'Foresta Oscura':'wild' };
  const placeIcons = { city:'⌂', wild:'♣', neutral:'★' };
  const info = { Masadora:'Magic Town! Solo qui puoi comprare le carte incantesimo!', Aiai:"La città dell'amore... piena di amanti e di emozioni.", Soufrabi:'Piccola città portuale controllata dai pirati di Razor... brrr', Antokiba:'Città dei premi!! Concorsi diversi ogni settimana! Città iniziale per ogni player.', Dorias:"Gioco d'azzardo, prostitute, criminali e tanti soldi, ma anche tante carte.", Rubicuta:'Vicino a Antokiba, città tranquilla dove riposarsi.', Limeiro:'La capitale è accessibile solo con tutte le carte collezionate!', Bunzen:'Città piena di nebbia e mostri strani.', 'Foresta Oscura':'Prima location in cui di solito i giocatori cercano di fare soldi e carte' };
  const routes = { Sperduto:['Masadora'], Masadora:['Antokiba','Foresta Oscura'], Antokiba:['Masadora','Rubicuta','Dorias'], Rubicuta:['Dorias','Antokiba','Aiai'], Dorias:['Rubicuta','Antokiba'], Aiai:['Rubicuta'], 'Foresta Oscura':['Bunzen','Masadora'], Bunzen:['Foresta Oscura','Soufrabi'], Soufrabi:['Bunzen'], Limeiro:[] };
  const labels = { nome:'Nome', cognome:'Cognome', eta:'Età', sesso:'Sesso', storia:'Storia', nen:'Abilità Nen', autore:'Autore preferito' };
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const location = () => state.character?.location || 'Sperduto';
  const canGo = place => place !== 'Limeiro' && (routes[location()] || []).includes(place);
  const ratio = value => `${value ?? 0}/${value ?? 0}`;
  const api = async (path = '', options = {}) => {
    const res = await fetch('/api/hxh-character' + path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    return data;
  };
  const style = document.createElement('style');
  style.textContent = `
    .hxh-welcome{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:30;color:#fff;font:700 24px/1.1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.01em;text-shadow:0 1px 0 #000,1px 1px 0 #000,-1px -1px 0 #000}.hxh-welcome strong{font-weight:900;color:#fff}
    .test-levelup{position:fixed;top:58px;left:50%;transform:translateX(-50%);z-index:30;border:1px solid #dfff73;background:rgba(22,75,0,.82);color:#dfff73;font:800 12px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:8px 11px;cursor:pointer;box-shadow:3px 3px 0 rgba(0,0,0,.72)}.test-levelup:hover{background:rgba(45,120,0,.92)}
    .location-display,.level-display{z-index:30;color:#fff;font:800 14px/1 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-transform:none;letter-spacing:.01em;text-shadow:0 1px 0 #000,1px 1px 0 #000,-1px -1px 0 #000;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}.location-display strong,.level-display strong{color:#fff}.level-display{position:fixed;top:22px;left:calc(var(--side,44px) + 288px)}
    .map-label{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;font-weight:800!important;font-style:normal!important;font-size:clamp(13px,1.65vw,22px)!important;letter-spacing:.01em!important;color:#fff!important;-webkit-text-stroke:1px #000;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000!important;text-transform:none!important}.map-label::before{content:attr(data-icon);display:inline-block;margin-right:.24em;-webkit-text-stroke:1px #000;color:inherit}.map-label.is-here{color:#00d12f!important}.map-label.can-go{color:#ffe600!important}.map-label.cant-go{color:#fff!important}.map-label:hover{filter:none!important}
    .param-card{display:none;width:min(720px,calc(100vw - var(--side,44px) - 36px));border:3px solid rgba(255,226,104,.95);background:rgba(9,20,18,.86);box-shadow:0 0 0 4px rgba(82,42,0,.8),10px 10px 0 rgba(0,0,0,.62),0 0 34px rgba(255,214,82,.32);backdrop-filter:blur(3px) saturate(1.25);padding:clamp(22px,4vw,42px);color:#fff}
    body.has-param-setup .creation-card{display:none!important}body.has-param-setup .param-card{display:block}body.has-param-setup .greed-game,body.has-param-setup .delete-character{display:none!important}
    .param-card h1{margin:0 0 18px;text-align:center;font-family:Impact,Haettenschweiler,'Arial Black',serif;font-size:clamp(30px,5vw,62px);line-height:.95;text-transform:uppercase;color:#ffe16a;text-shadow:0 3px 0 #7c2d00,0 6px 0 #1a0700}
    .param-note{margin:0 0 16px;text-align:center;font:900 14px/1.35 'Courier New',monospace;color:#eaffd7;text-transform:uppercase}.param-note strong{color:#dfff73}
    .stat-list{display:grid;gap:8px}.stat-row{display:grid;grid-template-columns:minmax(120px,1fr) 38px 54px 38px;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.48);padding:9px 10px}.stat-row span:first-child{font-weight:900;text-transform:uppercase;color:#f4ffe8}.stat-value{text-align:center;color:#ffe16a;font-weight:900}.stat-plus,.stat-minus{border:1px solid #dfff73;background:#1a5300;color:#dfff73;font:900 18px/1 'Courier New',monospace;cursor:pointer;padding:5px 0}.stat-minus{background:#551111;color:#ffd0d0;border-color:#ffd0d0}.stat-plus:disabled,.stat-minus:disabled{opacity:.25;cursor:not-allowed;background:#111;color:#777;border-color:#555}
    .stat-section{margin:0 0 16px}.stat-section h3{margin:0 0 8px;color:#dfff73;font:900 17px/1 'Courier New',monospace;text-transform:uppercase;letter-spacing:.06em}.stat-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.stat-tile{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.46);padding:9px}.stat-tile strong{display:block;color:#ffe16a;text-transform:uppercase;font-size:11px;margin-bottom:4px}.stat-tile span{font-weight:900}.stat-error{margin-top:10px;color:#ffb0b0;font-weight:900;text-align:center}
    @media(max-width:760px){.hxh-welcome{top:146px;width:calc(100vw - var(--side,38px) - 42px);text-align:center;font-size:20px}.test-levelup{top:190px}.level-display{top:104px;left:calc(var(--side,38px) + 14px)}.param-card{width:calc(100vw - var(--side,38px) - 28px)}.stat-mini-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  document.querySelectorAll('[data-place]').forEach(btn => {
    const type = placeTypes[btn.dataset.place] || 'neutral';
    btn.dataset.type = type;
    btn.dataset.icon = placeIcons[type] || '★';
  });
  const paramCard = document.createElement('section');
  paramCard.className = 'param-card';
  paramCard.setAttribute('aria-label', 'Scheda parametri');
  document.querySelector('.greed-island-page')?.insertBefore(paramCard, document.querySelector('[data-greed-game]'));
  if (nav && !nav.querySelector('[data-panel="stat"]')) {
    const statBtn = document.createElement('button');
    statBtn.type = 'button';
    statBtn.dataset.panel = 'stat';
    statBtn.textContent = 'STAT';
    nav.insertBefore(statBtn, nav.querySelector('[data-panel="guide"]'));
  }
  const statRows = (points, setup = false) => `<div class="stat-list">${Object.entries(paramLabels).map(([k,label]) => {
    const value = state.character?.params?.[k] || 0;
    const minus = setup ? `<button class="stat-minus" type="button" data-sub-param="${k}" ${value > 0 ? '' : 'disabled'}>-</button>` : '<span></span>';
    return `<div class="stat-row"><span>${label}</span>${minus}<span class="stat-value">${value}</span><button class="stat-plus" type="button" data-add-param="${k}" ${points > 0 ? '' : 'disabled'}>+</button></div>`;
  }).join('')}</div>${setup ? `<p class="param-note">Devi spendere tutti i punti iniziali per entrare nella mappa.</p>` : ''}`;
  const generalHtml = c => {
    const g = c.stats?.generali || {};
    return `<div class="stat-section"><h3>Statistiche generali</h3><div class="stat-mini-grid"><div class="stat-tile"><strong>Livello</strong><span>${g.livello ?? c.level}</span></div><div class="stat-tile"><strong>Esperienza</strong><span>${g.esperienza ?? c.xp} / ${g.prossimoLivello ?? c.nextXp}</span></div><div class="stat-tile"><strong>Punti parametro</strong><span>${g.puntiParametro ?? c.paramPoints}</span></div><div class="stat-tile"><strong>Energia</strong><span>${ratio(g.energia)}</span></div><div class="stat-tile"><strong>Salute generale</strong><span>${ratio(g.saluteGenerale)}</span></div><div class="stat-tile"><strong>Nen</strong><span>${ratio(g.nen)}</span></div></div></div>`;
  };
  const healthHtml = c => `<div class="stat-section"><h3>Statistiche salute</h3><div class="stat-mini-grid">${Object.entries(healthLabels).map(([k,label]) => `<div class="stat-tile"><strong>${label}</strong><span>${c.stats?.salute?.[k] ?? 0}</span></div>`).join('')}</div></div>`;
  const renderParamSetup = () => {
    const points = state.character?.setupPoints || 0;
    paramCard.innerHTML = `<h1>Scheda parametri</h1><p class="param-note">Punti iniziali rimasti: <strong>${points}</strong> / 10</p>${statRows(points, true)}<p class="stat-error" data-stat-error></p>`;
  };
  const bindAddButtons = root => {
    root.querySelectorAll('[data-add-param]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const data = await api('', { method:'POST', body:JSON.stringify({ action:'allocate', param:btn.dataset.addParam, amount:1 }) });
        state.character = data.character;
        renderState();
        if (state.character.setupPoints <= 0) openPanel('stat');
      } catch (err) {
        const error = root.querySelector('[data-stat-error]');
        if (error) error.textContent = err.message; else alert(err.message);
      }
    }));
    root.querySelectorAll('[data-sub-param]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const data = await api('', { method:'POST', body:JSON.stringify({ action:'deallocate', param:btn.dataset.subParam, amount:1 }) });
        state.character = data.character;
        renderState();
      } catch (err) {
        const error = root.querySelector('[data-stat-error]');
        if (error) error.textContent = err.message; else alert(err.message);
      }
    }));
  };
  const refreshMap = () => {
    const loc = location();
    if (locationLabel) locationLabel.textContent = loc;
    if (levelLabel) levelLabel.textContent = state.character?.level || 1;
    if (welcomeName) welcomeName.textContent = state.character?.nome || 'giocatore';
    document.querySelectorAll('[data-place]').forEach(btn => {
      const place = btn.dataset.place;
      btn.classList.toggle('is-here', place === loc);
      btn.classList.toggle('can-go', place !== loc && canGo(place));
      btn.classList.toggle('cant-go', place !== loc && !canGo(place));
    });
  };
  const renderState = () => {
    document.body.classList.remove('greed-not-logged');
    const hasChar = !!state.character;
    const setup = hasChar && (state.character.setupPoints || 0) > 0;
    document.body.classList.toggle('has-param-setup', setup);
    document.body.classList.toggle('has-greed-profile', hasChar && !setup);
    if (setup) { renderParamSetup(); bindAddButtons(paramCard); }
    refreshMap();
  };
  const blockLogin = () => {
    document.body.classList.add('greed-not-logged');
    document.body.classList.remove('has-greed-profile', 'has-param-setup', 'menu-open');
  };
  const infoHtml = data => `<h2>Info</h2><div class="info-grid">${Object.keys(labels).map(k => `<div class="info-item ${k === 'storia' || k === 'nen' ? 'wide' : ''}"><strong>${labels[k]}</strong><span>${esc(data[k])}</span></div>`).join('')}</div>`;
  const statHtml = c => `<h2>STAT</h2>${generalHtml(c)}<div class="stat-section"><h3>Parametri</h3><p class="param-note">Punti disponibili: <strong>${c.paramPoints || 0}</strong></p>${statRows(c.paramPoints || 0)}</div>${healthHtml(c)}<p class="stat-error" data-stat-error></p>`;
  const openPanel = async name => {
    if (!state.character) return;
    if ((state.character.setupPoints || 0) > 0 && name !== 'stat') return;
    if (name === 'players') {
      try {
        const data = await api('?list=1');
        const list = (data.characters || []).map(pg => `<li>${esc(pg.nome || pg.username)}${pg.level ? ` · LV ${pg.level}` : ''}</li>`).join('') || '<li>Nessun giocatore</li>';
        panel.innerHTML = `<h2>Giocatori</h2><ul class="player-list">${list}</ul>`;
      } catch (err) { panel.innerHTML = `<h2>Giocatori</h2><p>${esc(err.message)}</p>`; }
    }
    if (name === 'explore') panel.innerHTML = '<h2>Esplora</h2><p>Modulo esplorazione da costruire.</p>';
    if (name === 'info') panel.innerHTML = infoHtml(state.character);
    if (name === 'stat') panel.innerHTML = statHtml(state.character);
    if (name === 'guide') panel.innerHTML = '<h2>Guida</h2><p>Guida del gioco da scrivere.</p>';
    panel.classList.add('is-active');
    bindAddButtons(panel);
  };
  const init = async () => {
    if (!token()) return blockLogin();
    try {
      const data = await api();
      state = data;
      renderState();
    } catch { blockLogin(); }
  };
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!token()) return blockLogin();
    const payload = Object.fromEntries(new FormData(form).entries());
    if (Object.values(payload).some(v => !String(v).trim())) return;
    try {
      const data = await api('', { method:'POST', body:JSON.stringify({ action:'save', ...payload }) });
      state.character = data.character;
      renderState();
      history.pushState(null, '', '/greed-island/parametri/');
    } catch (err) { alert(err.message); }
  });
  testLevel.addEventListener('click', async () => {
    if (!state.character) return;
    try {
      const data = await api('', { method:'POST', body:JSON.stringify({ action:'levelup' }) });
      state.character = data.character;
      renderState();
      if (panel?.classList.contains('is-active')) openPanel('stat');
    } catch (err) { alert(err.message); }
  });
  toggle?.addEventListener('click', () => {
    const willOpen = !document.body.classList.contains('menu-open');
    if (willOpen && panel) panel.classList.remove('is-active');
    document.body.classList.toggle('menu-open');
  });
  document.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => openPanel(btn.dataset.panel)));
  document.querySelectorAll('[data-place]').forEach(btn => btn.addEventListener('click', () => {
    if ((state.character?.setupPoints || 0) > 0) return;
    const name = btn.dataset.place;
    selectedPlace = '';
    cityTitle.textContent = name;
    cityEnter.hidden = true;
    if (name === 'Limeiro') cityInfo.textContent = info.Limeiro;
    else if (!canGo(name) && location() !== name) cityInfo.textContent = 'non puoi arrivare qua a piedi da dove sei ora!';
    else {
      cityInfo.textContent = info[name] || '';
      if (location() !== name) { selectedPlace = name; cityEnter.hidden = false; }
    }
    cityPopup.classList.add('is-open');
  }));
  document.querySelector('[data-city-close]')?.addEventListener('click', () => cityPopup.classList.remove('is-open'));
  cityEnter?.addEventListener('click', async () => {
    if (!selectedPlace) return;
    try {
      const data = await api('', { method:'POST', body:JSON.stringify({ action:'move', place:selectedPlace }) });
      state.character = data.character;
      selectedPlace = '';
      cityPopup.classList.remove('is-open');
      refreshMap();
    } catch (err) { cityInfo.textContent = err.message; cityEnter.hidden = true; }
  });
  del?.addEventListener('click', async () => {
    try { await api('', { method:'DELETE' }); } catch {}
    state.character = null;
    form?.reset();
    panel?.classList.remove('is-active');
    cityPopup?.classList.remove('is-open');
    document.body.classList.remove('menu-open', 'has-param-setup');
    renderState();
    history.pushState(null, '', '/greed-island/');
  });
  init();
})();
