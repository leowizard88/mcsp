(() => {
  const game = document.querySelector('[data-greed-game]');
  const world = document.querySelector('.map-world') || game;
  const panel = document.querySelector('[data-menu-panel]');
  const cityPopup = document.querySelector('[data-city-popup]');
  const cityTitle = document.querySelector('[data-city-title]');
  const cityInfo = document.querySelector('[data-city-info]');
  const cityEnter = document.querySelector('[data-city-enter]');
  const locationLabel = document.querySelector('[data-location-label]');
  if (!game || !world) return;

  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const apiMove = async place => {
    const res = await fetch('/api/hxh-character', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ action:'move', place }), cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore movimento');
    return data.character;
  };

  const types = { city:'⌂', wild:'♣', neutral:'★' };
  const places = [
    ['Soufrabi',14,42,'city',''],['Bunzen',25,49,'city',''],['Limeiro',61,33,'city',''],['Masadora',53,52,'city',''],['Antokiba',62,59,'city',''],['Rubicuta',73,70,'city',''],['Dorias',63,80,'city',''],['Aiai',89,48,'city',''],
    ['Foresta Oscura',39,49,'wild','Zona selvaggia · difficoltà nabbo'],['Badlands',41,23,'wild','Zona selvaggia · difficoltà media'],['Villaggio di banditi',41,39,'wild','Zona selvaggia · difficoltà facile'],['Rovine infestate',79,78,'wild','Zona selvaggia · difficoltà impegnativo'],['Plateau Bye Bye',88,61,'wild','Zona selvaggia · difficoltà hardcore'],
    ['Shiso tree',57,54,'neutral','Zona neutra'],['Accampamento misterioso',76,48,'neutral','Zona neutra'],['Isola sul lago',54,71,'neutral','Zona neutra'],['Farlands',90,10,'neutral','Zona neutra'],['Casa senile',24,66,'neutral','Zona neutra']
  ];
  const routes = {
    Sperduto:['Masadora'],Soufrabi:['Bunzen','Casa senile'],Bunzen:['Soufrabi','Foresta Oscura','Casa senile','Villaggio di banditi'],'Casa senile':['Soufrabi','Bunzen','Dorias','Isola sul lago'],'Foresta Oscura':['Bunzen','Masadora','Villaggio di banditi','Badlands'],'Villaggio di banditi':['Bunzen','Foresta Oscura','Badlands','Limeiro'],Badlands:['Villaggio di banditi','Foresta Oscura','Limeiro'],Limeiro:['Badlands','Villaggio di banditi','Masadora','Accampamento misterioso'],Masadora:['Limeiro','Foresta Oscura','Antokiba','Shiso tree','Accampamento misterioso','Isola sul lago'],'Shiso tree':['Masadora','Antokiba'],Antokiba:['Masadora','Shiso tree','Rubicuta','Dorias','Isola sul lago'],'Isola sul lago':['Casa senile','Masadora','Antokiba','Dorias'],Dorias:['Isola sul lago','Antokiba','Rubicuta','Casa senile'],Rubicuta:['Antokiba','Dorias','Rovine infestate','Aiai','Accampamento misterioso'],'Rovine infestate':['Rubicuta','Dorias','Plateau Bye Bye'],'Plateau Bye Bye':['Rovine infestate','Aiai'],Aiai:['Plateau Bye Bye','Rubicuta','Accampamento misterioso','Farlands'],'Accampamento misterioso':['Masadora','Limeiro','Rubicuta','Aiai'],Farlands:['Aiai']
  };
  const info = Object.fromEntries(places.map(p => [p[0], p[4] || p[0]]));
  const current = () => locationLabel?.textContent?.trim() || 'Sperduto';
  const canGo = place => (routes[current()] || []).includes(place);

  document.querySelectorAll('.map-label').forEach(el => el.remove());
  places.forEach(([name,x,y,type]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-label';
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.dataset.place = name;
    b.dataset.type = type;
    b.dataset.icon = types[type] || '★';
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

  game.addEventListener('click', e => {
    const btn = e.target.closest('[data-place]');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const name = btn.dataset.place;
    cityTitle.textContent = name;
    cityInfo.textContent = name === current() ? (info[name] || '') : canGo(name) ? (info[name] || '') : 'non puoi arrivare qua a piedi da dove sei ora!';
    cityEnter.hidden = name === current() || !canGo(name);
    cityEnter.dataset.nextPlace = name;
    cityPopup.classList.add('is-open');
  }, true);

  cityEnter?.addEventListener('click', async e => {
    const place = cityEnter.dataset.nextPlace;
    if (!place) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try {
      const updated = await apiMove(place);
      if (updated?.location && locationLabel) locationLabel.textContent = updated.location;
      cityPopup.classList.remove('is-open');
      refresh();
    } catch (err) {
      cityInfo.textContent = err.message;
      cityEnter.hidden = true;
    }
  }, true);

  setInterval(refresh, 600);
  refresh();
})();
