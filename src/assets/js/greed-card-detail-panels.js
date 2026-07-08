(() => {
  const nav = document.querySelector('.side-menu');
  const panel = document.querySelector('[data-menu-panel]');
  if (!nav || !panel) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const apiCharacter = async () => {
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore personaggio');
    return data.character || {};
  };
  const apiTransform = async index => {
    const res = await fetch('/api/hxh-card-transform', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ action:'transform-item', index }), cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore trasformazione');
    return data;
  };
  const css = document.createElement('style');
  css.textContent = `
    .gi-side-detail{position:absolute;right:18px;top:74px;width:min(315px,calc(100% - 36px));z-index:7}.gi-anime-card{background:#090909;border:4px solid #f4f0df;border-radius:10px;box-shadow:0 0 0 2px #111,8px 8px 0 rgba(0,0,0,.55);padding:8px;color:#111}.gi-card-top{display:grid;grid-template-columns:54px 1fr 64px;gap:5px;margin-bottom:7px}.gi-card-top span{background:#f5f0dc;border:2px solid #111;min-height:38px;display:grid;place-items:center;font:900 20px/1 Georgia,serif}.gi-card-top .gi-card-title{font:900 14px/1.05 Arial,Helvetica,sans-serif;text-align:center;padding:0 4px}.gi-card-top .gi-card-rank{font:900 16px/1 'Courier New',monospace}.gi-card-art-big{height:150px;border:4px solid #f4f0df;background:linear-gradient(135deg,#081532,#102c66);display:grid;place-items:center;box-shadow:inset 0 0 0 2px #111;margin-bottom:9px}.gi-card-art-big svg{width:118px;height:118px;filter:drop-shadow(3px 3px 0 rgba(0,0,0,.35))}.gi-card-desc-box{background:#f4f0df;border:3px solid #111;min-height:112px;padding:12px;font:700 14px/1.35 Arial,Helvetica,sans-serif}.gi-card-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}.gi-card-meta div{background:#231017;color:#ffe16a;border:1px solid #f0abc8;padding:6px;font:900 11px/1.2 'Courier New',monospace;text-transform:uppercase}.gi-card-close{position:absolute;right:-9px;top:-9px;border:2px solid #fff;background:#870018;color:#fff;width:28px;height:28px;font:900 16px/1 Arial;cursor:pointer;box-shadow:2px 2px 0 #000}.inventory-shell{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,310px);gap:12px}.inventory-list button{width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.inventory-detail{border:2px solid #dfff73;background:rgba(0,0,0,.55);box-shadow:5px 5px 0 rgba(0,0,0,.62);padding:12px;color:#f4ffe8}.inventory-detail h3{margin:0 0 8px;color:#ffe16a;font:900 21px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;text-transform:uppercase}.inventory-detail p{margin:0 0 10px;font:400 14px/1.35 Arial,Helvetica,sans-serif}.inventory-actions{display:grid;gap:8px}.inventory-actions button{border:2px solid #dfff73;background:rgba(22,75,0,.82);color:#dfff73;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:10px;cursor:pointer}.inventory-actions button:disabled{opacity:.45;filter:grayscale(1);cursor:not-allowed}.inventory-detail-msg{margin-top:8px;color:#dfff73;font:900 12px/1.3 'Courier New',monospace}.inventory-detail-msg.err{color:#ff7474}@media(max-width:760px){.gi-side-detail{position:relative;right:auto;top:auto;width:100%;margin-top:12px}.inventory-shell{grid-template-columns:1fr}.inventory-detail{min-height:120px}}
  `;
  document.head.appendChild(css);
  const isSpell = item => !!(item?.spell || item?.isSpell || item?.kind === 'spell' || item?.cardType === 'spell' || item?.type === 'spell' || item?.category === 'spell' || item?.tipo === 'incantesimo');
  const rarity = card => String(card?.rarity || card?.rarita || card?.rank || card?.rango || 'E').toUpperCase();
  const limit = card => card?.limitLabel || card?.limiteLabel || (card?.globalLimit ?? card?.limiteGlobale ?? '∞');
  const desc = x => x?.description || x?.descrizione || '';
  const name = x => x?.name || x?.nome || 'Senza nome';
  const artSvg = card => {
    const art = card?.art || '';
    if (art === 'pig' || /maiale/i.test(name(card))) return `<svg viewBox="0 0 64 64" role="img"><ellipse cx="33" cy="36" rx="22" ry="15" fill="#f6a8b8" stroke="#36120d" stroke-width="3"/><circle cx="22" cy="24" r="8" fill="#f6a8b8" stroke="#36120d" stroke-width="3"/><circle cx="43" cy="24" r="8" fill="#f6a8b8" stroke="#36120d" stroke-width="3"/><ellipse cx="33" cy="38" rx="10" ry="7" fill="#ffc2ce" stroke="#36120d" stroke-width="3"/><circle cx="29" cy="38" r="1.8" fill="#36120d"/><circle cx="37" cy="38" r="1.8" fill="#36120d"/><circle cx="25" cy="31" r="2.2" fill="#120900"/><circle cx="41" cy="31" r="2.2" fill="#120900"/><path d="M48 44c7 0 8-8 2-8" fill="none" stroke="#36120d" stroke-width="3" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 64 64" role="img"><rect x="13" y="8" width="38" height="48" rx="4" fill="#fff4b8" stroke="#2a1200" stroke-width="4"/><path d="M19 20h26M19 30h26M19 40h18" stroke="#2a1200" stroke-width="4" stroke-linecap="round"/></svg>`;
  };
  const normalizeCards = c => {
    const normal = [], spells = [], raw = [];
    if (Array.isArray(c?.cards)) raw.push(...c.cards);
    if (Array.isArray(c?.binder)) raw.push(...c.binder);
    if (Array.isArray(c?.spellCards)) raw.push(...c.spellCards.map(x => ({ ...x, spell:true })));
    if (Array.isArray(c?.spells)) raw.push(...c.spells.map(x => ({ ...x, spell:true })));
    raw.forEach(item => {
      if (isSpell(item)) {
        const slot = Number(item.spellSlot ?? item.spellNumber ?? item.spellIndex ?? item.slot);
        const index = Number.isFinite(slot) && slot >= 0 && slot < 50 ? slot : spells.length;
        if (index < 50) spells[index] = item;
      } else {
        const number = Number(item.number ?? item.slot ?? item.id);
        if (Number.isFinite(number) && number >= 0 && number < 150) normal[number] = item;
      }
    });
    return { normal, spells };
  };
  const showCard = (card, slotLabel) => {
    panel.querySelector('.gi-side-detail')?.remove();
    if (!card) return;
    const uses = isSpell(card) ? (card.uses || card.usi || 'Effetto') : (card.uses || card.usi || 'Materializza');
    const box = document.createElement('aside');
    box.className = 'gi-side-detail';
    box.innerHTML = `<button type="button" class="gi-card-close" data-card-detail-close>×</button><div class="gi-anime-card"><div class="gi-card-top"><span>${esc(slotLabel)}</span><span class="gi-card-title">${esc(name(card))}</span><span class="gi-card-rank">${esc(rarity(card))}-${esc(limit(card))}</span></div><div class="gi-card-art-big">${artSvg(card)}</div><div class="gi-card-desc-box">${esc(desc(card) || 'Nessuna descrizione.')}</div><div class="gi-card-meta"><div>Tipo: ${isSpell(card) ? 'Incantesimo' : (Number(card.number ?? card.slot) < 100 ? 'Numerata' : 'Libera')}</div><div>Usi: ${esc(uses)}</div></div></div>`;
    (panel.querySelector('.binder-book') || panel).appendChild(box);
  };
  panel.addEventListener('click', async e => {
    if (e.target.closest('[data-card-detail-close]')) { e.target.closest('.gi-side-detail')?.remove(); return; }
    if (e.target.closest('button')) return;
    const slot = e.target.closest('.binder-slot.is-filled');
    if (!slot) return;
    const i = Number(slot.dataset.binderSlot);
    const label = slot.dataset.slot || String(i).padStart(3,'0');
    try {
      const c = await apiCharacter();
      const { normal, spells } = normalizeCards(c);
      showCard(label.startsWith('S') ? spells[i] : normal[i], label);
    } catch {}
  });
  const renderInventory = async () => {
    const c = await apiCharacter();
    const items = Array.isArray(c.inventory) ? c.inventory : [];
    panel.innerHTML = `<h2>Inventario</h2><div class="inventory-shell"><div>${items.length ? `<ul class="inventory-list">${items.map((item,i) => `<li><button type="button" data-inventory-item="${i}">${esc(name(item))}</button></li>`).join('')}</ul>` : '<p class="inventory-empty">Inventario vuoto.</p>'}</div><aside class="inventory-detail" data-inventory-detail><h3>Oggetto</h3><p>Clicca un oggetto per vedere dettagli e opzioni.</p></aside></div>`;
    panel.classList.add('is-active');
  };
  nav.addEventListener('click', e => {
    const btn = e.target.closest('[data-panel="inventory"]');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    renderInventory().catch(err => { panel.innerHTML = `<h2>Inventario</h2><p class="inventory-empty">${esc(err.message)}</p>`; panel.classList.add('is-active'); });
  }, true);
  panel.addEventListener('click', async e => {
    const itemBtn = e.target.closest('[data-inventory-item]');
    if (itemBtn) {
      const index = Number(itemBtn.dataset.inventoryItem);
      try {
        const c = await apiCharacter();
        const item = (c.inventory || [])[index];
        const detail = panel.querySelector('[data-inventory-detail]');
        if (!item || !detail) return;
        detail.innerHTML = `<h3>${esc(name(item))}</h3><p>${esc(desc(item) || 'Nessuna descrizione.')}</p><div class="inventory-actions"><button type="button" disabled>Usa</button><button type="button" disabled>Equipaggia</button><button type="button" data-transform-item="${index}">Trasforma in carta</button></div><div class="inventory-detail-msg" data-inventory-msg></div>`;
      } catch {}
    }
    const transform = e.target.closest('[data-transform-item]');
    if (transform) {
      const msg = panel.querySelector('[data-inventory-msg]');
      try {
        const data = await apiTransform(Number(transform.dataset.transformItem));
        window.dispatchEvent(new CustomEvent('greed-character-updated', { detail:data.character }));
        await renderInventory();
        const detail = panel.querySelector('[data-inventory-detail]');
        if (detail) detail.innerHTML = `<h3>Trasformato</h3><p>${esc(name(data.card))} è tornata nel Binder.</p>`;
      } catch (err) {
        if (msg) { msg.classList.add('err'); msg.textContent = err.message; }
      }
    }
  });
})();
