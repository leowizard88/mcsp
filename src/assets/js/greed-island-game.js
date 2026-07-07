(() => {
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const authHeaders = () => ({ 'content-type': 'application/json', authorization: `Bearer ${token()}` });
  const form = document.querySelector('[data-greed-form]');
  const del = document.querySelector('[data-delete-character]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const panel = document.querySelector('[data-menu-panel]');
  const cityPopup = document.querySelector('[data-city-popup]');
  const cityTitle = document.querySelector('[data-city-title]');
  const cityInfo = document.querySelector('[data-city-info]');
  const cityEnter = document.querySelector('[data-city-enter]');
  const locationLabel = document.querySelector('[data-location-label]');
  let state = { user: null, character: null };
  let selectedPlace = '';
  const info = { Masadora:'Magic Town! Solo qui puoi comprare le carte incantesimo!', Aiai:"La città dell'amore... piena di amanti e di emozioni.", Soufrabi:'Piccola città portuale controllata dai pirati di Razor... brrr', Antokiba:'Città dei premi!! Concorsi diversi ogni settimana! Città iniziale per ogni player.', Dorias:"Gioco d'azzardo, prostitute, criminali e tanti soldi, ma anche tante carte.", Rubicuta:'Vicino a Antokiba, città tranquilla dove riposarsi.', Limeiro:'La capitale è accessibile solo con tutte le carte collezionate!', Bunzen:'Città piena di nebbia e mostri strani.', 'Foresta Oscura':'Prima location in cui di solito i giocatori cercano di fare soldi e carte' };
  const routes = { Sperduto:['Masadora'], Masadora:['Antokiba','Foresta Oscura'], Antokiba:['Masadora','Rubicuta','Dorias'], Rubicuta:['Dorias','Antokiba','Aiai'], Dorias:['Rubicuta','Antokiba'], Aiai:['Rubicuta'], 'Foresta Oscura':['Bunzen','Masadora'], Bunzen:['Foresta Oscura','Soufrabi'], Soufrabi:['Bunzen'], Limeiro:[] };
  const labels = { nome:'Nome', cognome:'Cognome', eta:'Età', sesso:'Sesso', storia:'Storia', nen:'Abilità Nen', autore:'Autore preferito' };
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const location = () => state.character?.location || 'Sperduto';
  const canGo = place => place !== 'Limeiro' && (routes[location()] || []).includes(place);
  const api = async (path = '', options = {}) => {
    const res = await fetch('/api/hxh-character' + path, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    return data;
  };
  const refreshMap = () => {
    const loc = location();
    if (locationLabel) locationLabel.textContent = loc;
    document.querySelectorAll('[data-place]').forEach(btn => {
      const place = btn.dataset.place;
      btn.classList.toggle('is-here', place === loc);
      btn.classList.toggle('can-go', place !== loc && canGo(place));
      btn.classList.toggle('cant-go', place !== loc && !canGo(place));
    });
  };
  const renderState = () => {
    document.body.classList.remove('greed-not-logged');
    document.body.classList.toggle('has-greed-profile', !!state.character);
    refreshMap();
  };
  const blockLogin = () => {
    document.body.classList.add('greed-not-logged');
    document.body.classList.remove('has-greed-profile', 'menu-open');
  };
  const infoHtml = data => `<h2>Info</h2><div class="info-grid">${Object.keys(labels).map(k => `<div class="info-item ${k === 'storia' || k === 'nen' ? 'wide' : ''}"><strong>${labels[k]}</strong><span>${esc(data[k])}</span></div>`).join('')}</div>`;
  const openPanel = async name => {
    if (!state.character) return;
    if (name === 'players') {
      try {
        const data = await api('?list=1');
        const list = (data.characters || []).map(pg => `<li>${esc(pg.nome || pg.username)}</li>`).join('') || '<li>Nessun giocatore</li>';
        panel.innerHTML = `<h2>Giocatori</h2><ul class="player-list">${list}</ul>`;
      } catch (err) { panel.innerHTML = `<h2>Giocatori</h2><p>${esc(err.message)}</p>`; }
    }
    if (name === 'explore') panel.innerHTML = '<h2>Esplora</h2><p>Modulo esplorazione da costruire.</p>';
    if (name === 'info') panel.innerHTML = infoHtml(state.character);
    if (name === 'guide') panel.innerHTML = '<h2>Guida</h2><p>Guida del gioco da scrivere.</p>';
    panel.classList.add('is-active');
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
      history.pushState(null, '', '/greed-island/profilo/');
    } catch (err) { alert(err.message); }
  });
  toggle?.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  document.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => openPanel(btn.dataset.panel)));
  document.querySelectorAll('[data-place]').forEach(btn => btn.addEventListener('click', () => {
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
    document.body.classList.remove('menu-open');
    renderState();
    history.pushState(null, '', '/greed-island/');
  });
  init();
})();
