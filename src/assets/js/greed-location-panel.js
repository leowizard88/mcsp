(() => {
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const api = async (body = null) => {
    const options = body ? { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify(body), cache:'no-store' } : { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' };
    const res = await fetch('/api/hxh-character', options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Greed Island');
    return data;
  };
  const listPlayers = async () => {
    const res = await fetch('/api/hxh-character?list=1', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    return res.ok ? (data.characters || []) : [];
  };
  const places = {
    Masadora:{img:'Masadora.webp',desc:'La città magica! Una città colorata e fantastica piena di possibilità, infatti è uno dei posti con più traffico di npc e giocatori. Questo è l\'unico punto in cui puoi acquistare le Carte Incantesimo sulla mappa. Con 10.000 J puoi acquistare 3 carte a caso dalla macchina delle carte, ma ci sono anche altre opzioni. Molti giocatori cercano le Leave Card qui per uscire dal gioco, ma raramente escono dalla macchina.'},
    'Shiso tree':{img:'shiso.webp',desc:'Il punto iniziale del gioco dove i player fanno imboscate ai nuovi giocatori, attento a questa zona sembra che qui ci siano molte possibilità di venire scavallati.'},
    Antokiba:{img:'antokiba.webp',desc:'La città dei concorsi a premi! Pulla situazioni interessanti dagli eventi nella città.'},
    Rubicuta:{img:'Rubicuta.webp',desc:'Una tranquilla città perfetta per riposarsi senza la paura di venire fatti o peggio uccisi nel sonno. Molti npc e poco traffico di giocatori... il più delle volte.'},
    Dorias:{img:'dorias.webp',desc:'La città del gioco d\'azzardo, tutti e dico tutti possono entrare qua dentro: bimbi, donne, disabili, animali ecc, purtroppo è frequentata da gentaccia e non ci si può fidare di nessuno. Si dice che chi è vestito bene è trattato meglio.'},
    Aiai:{img:'City_Of_Aiai.webp',desc:'La stranissima città dell\'amore, nessuno sa perché ma chiunque qua può trovare l\'amore, anche Chrollo.'},
    Limeiro:{img:'Limeiro.webp',desc:'La capitale di Greed Island, se sei qui è perché hai completato la tua collezione, ben fatto!'},
    Bunzen:{img:'bunzen.webp',desc:'Una città molto piccola e piena di npc, sembra nascondere qualcosa...'},
    Soufrabi:{img:'soufrabi.webp',desc:'Una bellissima città portuale molto popolata e viva. Purtroppo il porto è stato catturato dai pirati Razor, si dice che chi riesce a riunire un team di 15 persone può provare ad affrontare i pirati e vincere una carta leggendaria.'},
    'Foresta Oscura':{img:'forest.jpg',desc:'Un posto da brividi, qui si può esplorare sperando di trovare oggetti e carte buone oppure fare qualche quest di livello semplice.'},
    'Villaggio di banditi':{img:'vilalge.webp',desc:'Un villaggio di criminali che finalmente hanno trovato una casa, sono sospettosi verso il prossimo e proveranno ad attaccarti... ma forse vanno solo capiti.'},
    'Casa senile':{img:'senile.jpg',desc:'La casa di un certo Jopper K. Long.'},
    'Isola sul lago':{img:'island.webp',desc:'Un\'isola che si dice ospiti una tribù pericolosa.'},
    Badlands:{img:'badlands.webp',desc:'Canyon di roccia molto dura, qui ci si può allenare in forza, sperando di non essere avvistati da altri player o da mostri.'},
    'Accampamento misterioso':{img:'camp.jpg',desc:'Degli individui mascherati da gatto stanno sorseggiando del tè intorno al falò, sono armati. Cosa ci faranno qui?'},
    'Rovine infestate':{img:'ruins.webp',desc:'Un temibile luogo dove fantasmi e cavalieri zombie proteggono un tesoro molto prezioso.'},
    'Plateau Bye Bye':{img:'plateau.png',desc:'La zona più selvaggia di Greed Island! Se pensi di avventurarti qui senza precauzioni ti conviene pregare.'},
    Farlands:{img:'greed.png',desc:'Zona neutra remota. Per ora non è collegata al resto della mappa.'}
  };
  const css = document.createElement('style');
  css.textContent = `
    .menu-button{background:rgba(14,84,22,.88)!important;border:1px solid rgba(223,255,115,.95)!important;border-radius:8px!important;box-shadow:3px 3px 0 rgba(0,0,0,.65)!important;padding:8px 11px!important;color:#fff!important;font-weight:800!important}
    .location-panel{position:fixed;right:18px;top:92px;z-index:27;width:min(440px,calc(100vw - var(--side,44px) - 38px));max-height:calc(100vh - 118px);overflow:auto;border:2px solid #ffe16a;background:rgba(4,12,9,.88);box-shadow:8px 8px 0 rgba(0,0,0,.72);color:#f7ffe8;font-family:Arial,Helvetica,sans-serif;backdrop-filter:blur(4px)}
    .location-panel-head{cursor:move;user-select:none;touch-action:none;background:linear-gradient(180deg,rgba(62,95,12,.96),rgba(22,48,10,.96));border-bottom:2px solid #ffe16a;padding:10px 12px;display:flex;justify-content:space-between;gap:12px;align-items:center}
    .location-panel-head strong{color:#ffe16a;font:900 20px/1 Arial,Helvetica,sans-serif;text-shadow:2px 2px 0 #000}.location-panel-head span{font:700 11px/1 Arial,Helvetica,sans-serif;color:#dfff73;text-transform:uppercase;letter-spacing:.08em}
    .location-panel-body{padding:12px}.location-photo{width:100%;aspect-ratio:16/9;object-fit:cover;border:2px solid rgba(255,255,255,.75);background:#111;box-shadow:4px 4px 0 rgba(0,0,0,.55)}
    .location-desc{font:400 14px/1.42 Arial,Helvetica,sans-serif;margin:12px 0;color:#f7ffe8}.location-count{border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.42);padding:9px 10px;margin:0 0 11px;font:800 13px/1.2 Arial,Helvetica,sans-serif;color:#fff}.location-count strong{color:#ffe16a}
    .location-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.location-actions button{border:1px solid #dfff73;background:rgba(22,75,0,.82);color:#dfff73;font:900 12px/1 Arial,Helvetica,sans-serif;text-transform:uppercase;padding:10px 8px;cursor:pointer}.location-actions button:hover{background:rgba(45,120,0,.92)}.location-actions button:disabled{background:#666!important;border-color:#aaa!important;color:#ddd!important;cursor:not-allowed;filter:grayscale(1);opacity:.72}
    .location-panel-msg{margin-top:10px;font:800 13px/1.3 Arial,Helvetica,sans-serif;color:#dfff73}.location-panel-msg.err{color:#ff7474}.location-rest-note{font:400 12px/1.3 Arial,Helvetica,sans-serif;color:#ddd;margin-top:8px}.location-rest-timer{margin-top:8px;color:#ffdf7b;font:900 12px/1.3 Arial,Helvetica,sans-serif}.location-rest-penalty{margin-top:8px;color:#ffb0b0;font:900 12px/1.3 Arial,Helvetica,sans-serif}
    @media(max-width:760px){.location-panel{right:10px;top:232px;width:calc(100vw - var(--side,38px) - 28px);max-height:calc(100vh - 246px)}}
  `;
  document.head.appendChild(css);

  const panel = document.createElement('aside');
  panel.className = 'location-panel';
  panel.innerHTML = '<div class="location-panel-head" data-loc-drag><strong data-loc-title>Location</strong><span>trascina</span></div><div class="location-panel-body" data-loc-body></div>';
  game.appendChild(panel);
  const body = panel.querySelector('[data-loc-body]');
  const title = panel.querySelector('[data-loc-title]');
  let currentCharacter = null;
  const fmt = secs => {
    secs = Math.max(0, Math.floor(Number(secs) || 0));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const render = async (character = currentCharacter) => {
    if (!character) {
      try { character = (await api()).character; } catch { return; }
    }
    currentCharacter = character;
    const loc = character?.location || 'Shiso tree';
    const meta = places[loc] || places['Shiso tree'];
    const players = await listPlayers();
    const count = players.filter(p => (p.location || 'Shiso tree') === loc).length;
    const cd = character?.restCooldownSecondsLeft || 0;
    const penalty = character?.restPenaltySecondsLeft || 0;
    title.textContent = loc;
    body.innerHTML = `
      <img class="location-photo" src="/assets/img/${meta.img}" alt="${esc(loc)}">
      <p class="location-desc">${esc(meta.desc)}</p>
      <div class="location-count">Giocatori in questo luogo: <strong>${count}</strong></div>
      <div class="location-actions"><button type="button" data-loc-action="activity">Attività</button><button type="button" data-loc-action="rest" ${cd > 0 ? 'disabled' : ''}>Riposa</button><button type="button" data-loc-action="card">Usa carta</button></div>
      <p class="location-rest-note">Riposa: energia piena, cooldown globale di 3 ore. Dopo il riposo tutti i parametri effettivi scendono di 1 per 10 minuti.</p>
      ${cd > 0 ? `<div class="location-rest-timer">Riposo disponibile tra: ${fmt(cd)}</div>` : '<div class="location-rest-timer">Riposo disponibile ora.</div>'}
      ${penalty > 0 ? `<div class="location-rest-penalty">Penalità riposo attiva: -1 a tutti i parametri per ${fmt(penalty)}.</div>` : ''}
      <div class="location-panel-msg" data-loc-msg></div>
    `;
  };

  panel.addEventListener('click', async e => {
    const action = e.target.closest('[data-loc-action]')?.dataset.locAction;
    if (!action) return;
    const msg = panel.querySelector('[data-loc-msg]');
    msg.classList.remove('err');
    if (action !== 'rest') {
      msg.textContent = 'Questa azione non è ancora implementata.';
      return;
    }
    try {
      msg.textContent = 'Riposo in corso...';
      const data = await api({ action:'rest' });
      currentCharacter = data.character;
      window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
      await render(data.character);
      const msg2 = panel.querySelector('[data-loc-msg]');
      msg2.textContent = 'Energia ripristinata. Parametri -1 per 10 minuti. Prossimo riposo tra 3 ore.';
    } catch (err) {
      msg.classList.add('err');
      msg.textContent = err.message;
    }
  });

  let drag = null;
  const stopDrag = e => {
    if (!drag) return;
    const id = drag.pointerId;
    drag = null;
    try { panel.releasePointerCapture?.(id); } catch {}
  };
  panel.querySelector('[data-loc-drag]').addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drag = { pointerId:e.pointerId, x:e.clientX, y:e.clientY, left:panel.offsetLeft, top:panel.offsetTop };
    try { panel.setPointerCapture?.(e.pointerId); } catch {}
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    if (e.buttons !== undefined && e.buttons === 0) return stopDrag(e);
    e.preventDefault();
    const nextLeft = drag.left + e.clientX - drag.x;
    const nextTop = drag.top + e.clientY - drag.y;
    panel.style.left = Math.max(0, Math.min(window.innerWidth - 80, nextLeft)) + 'px';
    panel.style.right = 'auto';
    panel.style.top = Math.max(0, Math.min(window.innerHeight - 80, nextTop)) + 'px';
  }, { passive:false });
  window.addEventListener('pointerup', stopDrag, true);
  window.addEventListener('pointercancel', stopDrag, true);
  window.addEventListener('blur', stopDrag);
  document.addEventListener('mouseleave', stopDrag);

  window.addEventListener('greed-character-updated', e => render(e.detail));
  setInterval(async () => {
    try { await render((await api()).character); } catch { await render(currentCharacter); }
  }, 1000);
  setTimeout(() => render(), 500);
})();
