(() => {
  const game = document.querySelector('[data-greed-game]');
  const world = document.querySelector('.map-world') || game;
  const cityPopup = document.querySelector('[data-city-popup]');
  const cityTitle = document.querySelector('[data-city-title]');
  const cityInfo = document.querySelector('[data-city-info]');
  const cityEnter = document.querySelector('[data-city-enter]');
  const locationLabel = document.querySelector('[data-location-label]');
  if (!game || !world) return;

  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  let currentCharacter = null;
  const style = document.createElement('style');
  style.textContent = `
    .map-label[data-type="city"]::before{content:'●'!important;color:#fff!important;-webkit-text-stroke:1px #000!important}
    .map-label[data-type="wild"]::before{content:'♣ ' attr(data-danger)!important;color:inherit!important;-webkit-text-stroke:1px #000!important}
    .map-label[data-type="neutral"]::before{content:'★'!important;color:inherit!important;-webkit-text-stroke:1px #000!important}
    .city-blocked{display:block;margin-top:10px;color:#ff4b4b;font-weight:800}.city-cost{display:block;margin-top:10px;color:#dfff73;font-weight:900}.city-cost.no-energy{color:#ff4b4b}
    .city-actions button:disabled{opacity:.45;filter:grayscale(1);cursor:not-allowed;background:#777!important;color:#ddd!important}
  `;
  document.head.appendChild(style);

  const apiGet = async () => {
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    currentCharacter = data.character;
    return currentCharacter;
  };
  const apiMove = async place => {
    const res = await fetch('/api/hxh-character', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ action:'move', place }), cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore movimento');
    currentCharacter = data.character;
    return data.character;
  };
  const selectLocation = (place, character = currentCharacter) => window.dispatchEvent(new CustomEvent('greed-location-selected', { detail:{ place, character } }));

  const places = [
    ['Soufrabi',14,42,'city',0,'Città portuale a ovest. Punto di passaggio verso Bunzen e la costa.'],
    ['Bunzen',25,49,'city',0,'Città nebbiosa e periferica. Collega Soufrabi, Foresta Oscura e Casa senile.'],
    ['Limeiro',61,33,'city',0,'Capitale di Greed Island. Off limits finché non possiedi tutte le carte.'],
    ['Masadora',53,52,'city',0,'Magic Town. Qui si comprano carte incantesimo e si raggiungono Shiso tree e Foresta Oscura.'],
    ['Antokiba',62,59,'city',0,'Città dei premi e punto centrale per muoversi verso Rubicuta, Isola sul lago e Accampamento misterioso.'],
    ['Rubicuta',73,70,'city',0,'Città di passaggio verso Dorias e le Rovine infestate.'],
    ['Dorias',63,80,'city',0,'Zona urbana meridionale vicina a Rubicuta e alle Rovine infestate.'],
    ['Aiai',89,48,'city',0,"La città dell'amore. Collegata ad Accampamento misterioso e Plateau Bye Bye."],
    ['Foresta Oscura',39,49,'wild',1,'Zona selvaggia. Difficoltà 1/5, livello nabbo.'],
    ['Badlands',41,23,'wild',3,'Zona selvaggia. Difficoltà 3/5, media. Area dura a nord.'],
    ['Villaggio di banditi',41,39,'wild',2,'Zona selvaggia. Difficoltà 2/5, facile. Insediamento ostile.'],
    ['Rovine infestate',79,78,'wild',4,'Zona selvaggia. Difficoltà 4/5, impegnativa. Rovine pericolose.'],
    ['Plateau Bye Bye',88,61,'wild',5,'Zona selvaggia. Difficoltà 5/5, hardcore. Plateau estremo.'],
    ['Shiso tree',57,54,'neutral',0,'Zona neutra. Albero speciale vicino a Masadora e Antokiba.'],
    ['Accampamento misterioso',76,48,'neutral',0,'Zona neutra. Accampamento enigmatico tra Antokiba e Aiai.'],
    ['Isola sul lago',54,71,'neutral',0,'Zona neutra. Piccola isola raggiungibile da Antokiba.'],
    ['Farlands',90,10,'neutral',0,'Zona neutra remota. Per ora non collegata.'],
    ['Casa senile',24,66,'neutral',0,'Zona neutra. Casa isolata raggiungibile da Bunzen.']
  ];
  const routes = {
    Masadora:['Shiso tree','Foresta Oscura','Limeiro'],
    'Shiso tree':['Masadora','Antokiba'],
    'Foresta Oscura':['Masadora','Villaggio di banditi','Bunzen'],
    Antokiba:['Shiso tree','Rubicuta','Isola sul lago','Accampamento misterioso'],
    Bunzen:['Foresta Oscura','Soufrabi','Casa senile'],
    'Villaggio di banditi':['Badlands','Foresta Oscura','Limeiro'],
    Badlands:['Villaggio di banditi','Limeiro'],
    'Casa senile':['Bunzen'],
    'Isola sul lago':['Antokiba'],
    Rubicuta:['Antokiba','Rovine infestate','Dorias'],
    'Rovine infestate':['Rubicuta','Dorias','Plateau Bye Bye'],
    Dorias:['Rubicuta','Rovine infestate'],
    'Plateau Bye Bye':['Rovine infestate','Aiai'],
    'Accampamento misterioso':['Antokiba','Aiai'],
    Aiai:['Accampamento misterioso','Plateau Bye Bye'],
    Limeiro:['Masadora','Badlands'],
    Soufrabi:['Bunzen'],
    Farlands:[],
    Sperduto:['Shiso tree']
  };
  const byName = Object.fromEntries(places.map(p => [p[0], p]));
  const current = () => locationLabel?.textContent?.trim() || currentCharacter?.location || 'Shiso tree';
  const hasAllCards = () => false;
  const energy = () => currentCharacter?.stats?.generali?.energia ?? currentCharacter?.energy ?? 0;
  const moveCost = () => currentCharacter?.moveEnergyCost || currentCharacter?.stats?.generali?.costoMovimento || 1;
  const blockReason = place => {
    const loc = current();
    if (currentCharacter?.exhaustionActive) return 'Esaurimento attivo: non puoi fare attività.';
    if ((currentCharacter?.fatigue || 0) >= 30) return 'Sei esausto: non puoi muoverti. Collassa a terra dalla schermata STAT.';
    if (loc === place) return 'Sei già qui.';
    if (place === 'Limeiro' && !hasAllCards()) return 'Limeiro è off limits finché non possiedi tutte le carte.';
    if (!(routes[loc] || []).includes(place)) return 'Non puoi arrivare qua a piedi da dove sei ora.';
    if (energy() < moveCost()) return 'Non hai energie.';
    return '';
  };
  const canGo = place => !blockReason(place);

  document.querySelectorAll('.map-label').forEach(el => el.remove());
  places.forEach(([name,x,y,type,danger]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-label';
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.dataset.place = name;
    b.dataset.type = type;
    b.dataset.danger = danger || '';
    b.textContent = name;
    world.appendChild(b);
  });

  const refresh = () => {
    const loc = current();
    document.querySelectorAll('[data-place]').forEach(btn => {
      const place = btn.dataset.place;
      btn.classList.toggle('is-here', place === loc);
      btn.classList.toggle('can-go', place !== loc && canGo(place));
      btn.classList.toggle('cant-go', place !== loc && !canGo(place));
    });
  };

  game.addEventListener('click', async e => {
    const btn = e.target.closest('[data-place]');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try { await apiGet(); } catch {}
    const name = btn.dataset.place;
    const place = byName[name];
    const reason = blockReason(name);
    const reachable = !reason;
    cityTitle.textContent = name;
    const cost = reachable ? `<span class="city-cost">Userai ${moveCost()} energia.</span>` : reason === 'Non hai energie.' ? `<span class="city-cost no-energy">Non hai energie. Questo spostamento richiede ${moveCost()} energia.</span>` : '';
    cityInfo.innerHTML = `${place?.[5] || name}${reason ? `<span class="city-blocked">${reason}</span>` : ''}${cost}`;
    cityEnter.hidden = false;
    cityEnter.disabled = !!reason;
    cityEnter.dataset.nextPlace = name;
    cityPopup.classList.add('is-open');
  }, true);

  cityEnter?.addEventListener('click', async e => {
    const place = cityEnter.dataset.nextPlace;
    if (!place || cityEnter.disabled) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try {
      const updated = await apiMove(place);
      if (updated?.location && locationLabel) locationLabel.textContent = updated.location;
      window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:updated }));
      selectLocation(updated.location || place, updated);
      cityPopup.classList.remove('is-open');
      refresh();
    } catch (err) {
      cityInfo.innerHTML += `<span class="city-blocked">${err.message}</span>`;
      cityEnter.disabled = true;
    }
  }, true);

  window.addEventListener('greed-character-updated', e => { if (e.detail) currentCharacter = e.detail; refresh(); });
  apiGet().then(c => { refresh(); }).catch(refresh);
  setInterval(refresh, 800);
})();
