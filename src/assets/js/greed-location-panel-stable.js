(() => {
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;
  document.querySelectorAll('.location-panel').forEach(el => el.remove());

  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const api = async (body = null) => {
    const options = body
      ? { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify(body), cache:'no-store' }
      : { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' };
    const res = await fetch('/api/hxh-character', options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    return data;
  };
  const places = {
    Masadora:{type:'city',img:'Masadora.webp',desc:'La città magica! Una città colorata e fantastica piena di possibilità. Qui puoi acquistare Carte Incantesimo.'},
    'Shiso tree':{type:'neutral',img:'shiso.webp',desc:'Il punto iniziale del gioco. Qui i player fanno imboscate ai nuovi giocatori.'},
    Antokiba:{type:'city',img:'antokiba.webp',desc:'La città dei concorsi a premi! Pulla situazioni interessanti dagli eventi nella città.'},
    Rubicuta:{type:'city',img:'Rubicuta.webp',desc:'Una tranquilla città perfetta per riposarsi senza troppa paura.'},
    Dorias:{type:'city',img:'dorias.webp',desc:'La città del gioco d’azzardo. Si dice che chi è vestito bene venga trattato meglio.'},
    Aiai:{type:'city',img:'City_Of_Aiai.webp',desc:'La stranissima città dell’amore.'},
    Limeiro:{type:'city',img:'Limeiro.webp',desc:'La capitale di Greed Island. Se sei qui è perché hai completato la collezione.'},
    Bunzen:{type:'city',img:'bunzen.webp',desc:'Una città molto piccola e piena di npc, sembra nascondere qualcosa...'},
    Soufrabi:{type:'city',img:'soufrabi.webp',desc:'Una bellissima città portuale molto popolata e viva.'},
    'Foresta Oscura':{type:'wild',img:'forest.jpg',desc:'Un posto da brividi. Qui si può esplorare sperando di trovare oggetti, carte o quest.'},
    'Villaggio di banditi':{type:'wild',img:'vilalge.webp',desc:'Un villaggio di criminali sospettosi verso il prossimo.'},
    Badlands:{type:'wild',img:'badlands.webp',desc:'Canyon di roccia molto dura. Qui ci si può allenare in forza.'},
    'Rovine infestate':{type:'wild',img:'ruins.webp',desc:'Un luogo temibile dove fantasmi e cavalieri zombie proteggono un tesoro.'},
    'Plateau Bye Bye':{type:'wild',img:'plateau.png',desc:'La zona più selvaggia di Greed Island.'},
    'Casa senile':{type:'neutral',img:'senile.jpg',desc:'La casa di un certo Jopper K. Long.'},
    'Isola sul lago':{type:'neutral',img:'island.webp',desc:'Un’isola che si dice ospiti una tribù pericolosa.'},
    'Accampamento misterioso':{type:'neutral',img:'camp.jpg',desc:'Individui mascherati da gatto sorseggiano tè intorno al falò.'},
    Farlands:{type:'neutral',img:'greed.png',desc:'Zona neutra remota.'}
  };
  const css = document.createElement('style');
  css.textContent = `
    .side-menu [data-panel="explore"]{display:none!important}.location-panel{position:fixed;right:18px;top:92px;z-index:34;width:min(440px,calc(100vw - var(--side,44px) - 38px));max-height:calc(100vh - 118px);overflow:auto;border:2px solid #ffe16a;background:rgba(4,12,9,.9);box-shadow:8px 8px 0 rgba(0,0,0,.72);color:#f7ffe8;font-family:Arial,Helvetica,sans-serif;backdrop-filter:blur(4px)}.location-panel.is-closed{display:none!important}.location-panel-head{cursor:move;user-select:none;touch-action:none;background:linear-gradient(180deg,rgba(62,95,12,.96),rgba(22,48,10,.96));border-bottom:2px solid #ffe16a;padding:10px 42px 10px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center;position:relative}.location-panel-head strong{color:#ffe16a;font:900 20px/1 Arial,Helvetica,sans-serif;text-shadow:2px 2px 0 #000}.location-panel-head span{font:700 11px/1 Arial,Helvetica,sans-serif;color:#dfff73;text-transform:uppercase;letter-spacing:.08em}.location-close{position:absolute;right:8px;top:6px;width:28px;height:28px;border:1px solid #ffe16a;background:rgba(90,0,0,.85);color:#fff;font:900 16px/1 Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:2px 2px 0 #000}.location-close:hover{background:#b0001b}.location-panel-body{padding:12px}.location-photo{width:100%;aspect-ratio:16/9;object-fit:cover;border:2px solid rgba(255,255,255,.75);background:#111;box-shadow:4px 4px 0 rgba(0,0,0,.55)}.location-desc{font:400 14px/1.42 Arial,Helvetica,sans-serif;margin:12px 0;color:#f7ffe8}.location-count{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.42);padding:9px 10px;margin:0 0 11px;font:800 13px/1.2 Arial,Helvetica,sans-serif;color:#fff}.location-count strong{color:#ffe16a}.location-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.location-actions button{border:1px solid #dfff73;background:rgba(22,75,0,.82);color:#dfff73;font:900 12px/1 Arial,Helvetica,sans-serif;text-transform:uppercase;padding:10px 8px;cursor:pointer}.location-actions button:hover{background:rgba(45,120,0,.92)}.location-actions button:disabled{background:#666!important;border-color:#aaa!important;color:#ddd!important;cursor:not-allowed;filter:grayscale(1);opacity:.72}.location-panel.is-busy .location-actions button{pointer-events:none;opacity:.62}.location-panel-msg{margin-top:10px;font:800 13px/1.3 Arial,Helvetica,sans-serif;color:#dfff73}.location-panel-msg.err{color:#ff7474}.location-rest-note{font:400 12px/1.3 Arial,Helvetica,sans-serif;color:#ddd;margin-top:8px}.location-rest-timer{margin-top:8px;color:#ffdf7b;font:900 12px/1.3 Arial,Helvetica,sans-serif}.location-rest-penalty{margin-top:8px;color:#ffb0b0;font:900 12px/1.3 Arial,Helvetica,sans-serif}@media(max-width:760px){.location-panel{right:10px;top:232px;width:calc(100vw - var(--side,38px) - 28px);max-height:calc(100vh - 246px)}}`;
  document.head.appendChild(css);

  const panel = document.createElement('aside');
  panel.className = 'location-panel';
  panel.innerHTML = `<div class="location-panel-head" data-loc-drag><strong data-loc-title>Location</strong><span>trascina</span><button type="button" class="location-close" data-location-close>×</button></div><div class="location-panel-body"><img class="location-photo" data-loc-img alt=""><p class="location-desc" data-loc-desc></p><div class="location-count">Giocatori in questo luogo: <strong data-loc-count>?</strong></div><div class="location-actions" data-loc-actions></div><p class="location-rest-note" data-loc-note></p><div class="location-rest-timer" data-loc-rest-timer></div><div class="location-rest-penalty" data-loc-penalty></div><div class="location-panel-msg" data-loc-msg></div></div>`;
  game.appendChild(panel);
  const $ = sel => panel.querySelector(sel);
  let currentCharacter = null, selectedLocation = null, lastRenderedLocation = '', busy = false, lastCountFetch = 0;
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };
  const countPlayers = async loc => {
    if (Date.now() - lastCountFetch < 8000) return;
    lastCountFetch = Date.now();
    try {
      const res = await fetch('/api/hxh-character?list=1', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      const count = res.ok ? (data.characters || []).filter(p => (p.location || 'Shiso tree') === loc).length : '?';
      $('[data-loc-count]').textContent = count;
    } catch { $('[data-loc-count]').textContent = '?'; }
  };
  const actionHtml = (loc, meta, c) => {
    const here = loc === (c?.location || 'Shiso tree');
    if (meta.type === 'city') return `<button type="button" data-loc-action="activity">Attività</button><button type="button" data-loc-action="rest" ${!here || c?.restCooldownSecondsLeft > 0 ? 'disabled' : ''}>Riposa</button><button type="button" data-loc-action="card">Usa carta</button>`;
    if (meta.type === 'wild') return `<button type="button" data-loc-action="explore" ${!here ? 'disabled' : ''}>Esplora</button><button type="button" data-loc-action="card">Usa carta</button>`;
    return `<button type="button" data-loc-action="activity">Attività</button><button type="button" data-loc-action="card">Usa carta</button>`;
  };
  const updateTimers = () => {
    const c = currentCharacter || {};
    const meta = places[selectedLocation] || places['Shiso tree'];
    const cd = c.restCooldownSecondsLeft || 0;
    const pen = c.restPenaltySecondsLeft || 0;
    $('[data-loc-rest-timer]').textContent = meta.type === 'city' ? (cd > 0 ? `Riposo disponibile tra: ${fmt(cd)}` : (selectedLocation === c.location ? 'Riposo disponibile ora.' : 'Devi essere qui per riposare.')) : '';
    $('[data-loc-penalty]').textContent = pen > 0 ? `Penalità riposo attiva: -1 a tutti i parametri per ${fmt(pen)}.` : '';
    if (cd > 0) c.restCooldownSecondsLeft = Math.max(0, cd - 1);
    if (pen > 0) c.restPenaltySecondsLeft = Math.max(0, pen - 1);
  };
  const render = async (loc = selectedLocation, c = currentCharacter, force = false) => {
    if (busy && !force) return;
    if (!c) { try { c = (await api()).character; } catch {} }
    if (c) currentCharacter = c;
    selectedLocation = loc || currentCharacter?.location || 'Shiso tree';
    const meta = places[selectedLocation] || places['Shiso tree'];
    panel.classList.remove('is-closed');
    if (force || selectedLocation !== lastRenderedLocation) {
      lastRenderedLocation = selectedLocation;
      $('[data-loc-title]').textContent = selectedLocation;
      const img = $('[data-loc-img]');
      const src = `/assets/img/${meta.img}`;
      if (img.getAttribute('src') !== src) img.src = src;
      img.alt = selectedLocation;
      $('[data-loc-desc]').textContent = meta.desc;
      lastCountFetch = 0;
    }
    $('[data-loc-actions]').innerHTML = actionHtml(selectedLocation, meta, currentCharacter || {});
    $('[data-loc-note]').textContent = meta.type === 'city' ? 'Riposa: energia e vita piene, cooldown globale di 3 ore. Dopo il riposo tutti i parametri effettivi scendono di 1 per 10 minuti.' : meta.type === 'wild' ? 'Esplora: azione selvaggia della zona. Meccanica da collegare.' : '';
    updateTimers();
    countPlayers(selectedLocation);
  };
  $('[data-location-close]').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); panel.classList.add('is-closed'); }, true);
  panel.addEventListener('click', async e => {
    const btn = e.target.closest('[data-loc-action]');
    if (!btn || busy) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const msg = $('[data-loc-msg]');
    msg.classList.remove('err'); msg.textContent = '';
    const action = btn.dataset.locAction;
    if (action === 'explore') { msg.textContent = 'Esplorazione da implementare: qui finiranno oggetti, carte, mostri e quest della zona selvaggia.'; return; }
    if (action !== 'rest') { msg.textContent = 'Questa azione non è ancora implementata.'; return; }
    try {
      busy = true; panel.classList.add('is-busy'); btn.disabled = true; msg.textContent = 'Riposo in corso...';
      const data = await api({ action:'rest' });
      currentCharacter = data.character;
      selectedLocation = data.character?.location || selectedLocation;
      window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      await render(selectedLocation, data.character, true);
      $('[data-loc-msg]').textContent = 'Energia e vita ripristinate. Parametri -1 per 10 minuti. Prossimo riposo tra 3 ore.';
    } catch (err) {
      msg.classList.add('err'); msg.textContent = err.message;
    } finally { busy = false; panel.classList.remove('is-busy'); }
  }, true);
  window.addEventListener('greed-location-selected', e => render(e.detail?.place, e.detail?.character || currentCharacter, true));
  window.addEventListener('greed-character-updated', e => {
    const old = currentCharacter?.location;
    currentCharacter = e.detail || currentCharacter;
    if (currentCharacter?.location && currentCharacter.location !== old) render(currentCharacter.location, currentCharacter, true);
    else if (!panel.classList.contains('is-closed')) render(selectedLocation, currentCharacter, false);
  });
  setInterval(() => { if (!panel.classList.contains('is-closed')) updateTimers(); }, 1000);
  setTimeout(async () => { try { const c = (await api()).character; await render(c?.location || 'Shiso tree', c, true); } catch {} }, 500);
})();
