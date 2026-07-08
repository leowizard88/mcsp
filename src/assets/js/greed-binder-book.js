(() => {
  const nav = document.querySelector('.side-menu');
  const panel = document.querySelector('[data-menu-panel]');
  if (!nav || !panel) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const apiCharacter = async () => {
    const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore Binder Book');
    return data.character || {};
  };
  const css = document.createElement('style');
  css.textContent = `
    .binder-book{position:relative;perspective:1400px;min-height:560px;padding:8px 0 0}.binder-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:0 0 12px}.binder-head h2{margin:0!important;color:#ffe16a!important}.binder-count{color:#dfff73;font:900 12px/1.2 'Courier New',monospace;text-transform:uppercase}.binder-shell{position:relative;background:linear-gradient(90deg,#180802 0%,#441500 8%,#1a0700 50%,#441500 92%,#180802 100%);border:3px solid #ffe16a;box-shadow:10px 10px 0 rgba(0,0,0,.78),inset 0 0 34px rgba(255,225,106,.13);padding:18px;border-radius:10px;overflow:hidden}.binder-shell::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:14px;transform:translateX(-50%);background:linear-gradient(90deg,rgba(0,0,0,.7),rgba(255,255,255,.16),rgba(0,0,0,.75));box-shadow:0 0 22px rgba(0,0,0,.9);z-index:1}.binder-page{position:relative;z-index:2;background:linear-gradient(135deg,rgba(255,246,200,.95),rgba(198,164,92,.92));border:2px solid #2a1200;border-radius:7px;min-height:430px;padding:16px;color:#120900;box-shadow:inset 0 0 28px rgba(70,28,0,.24);transform-origin:left center;animation:binderFlip .34s ease both}.binder-page.is-back{transform-origin:right center}.binder-page-title{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:2px solid rgba(42,18,0,.55);padding-bottom:8px;margin-bottom:12px;font:900 14px/1.2 'Courier New',monospace;text-transform:uppercase}.binder-page-title strong{font:900 24px/1 Impact,Haettenschweiler,'Arial Black',sans-serif;color:#481800}.binder-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.binder-slot{position:relative;min-height:66px;border:2px solid rgba(42,18,0,.72);background:rgba(255,255,255,.38);box-shadow:inset 0 0 14px rgba(0,0,0,.12);padding:8px 8px 8px 54px;overflow:hidden}.binder-slot::before{content:attr(data-slot);position:absolute;left:7px;top:7px;width:38px;height:28px;display:grid;place-items:center;background:#170800;color:#ffe16a;font:900 12px/1 'Courier New',monospace;border-radius:3px}.binder-slot.is-free::before{background:#173000;color:#dfff73}.binder-slot.is-spell{border-color:#c99100;background:linear-gradient(135deg,rgba(255,244,180,.76),rgba(235,193,45,.44))}.binder-slot.is-spell::before{background:#7b4b00;color:#fff3a3}.binder-slot.is-filled{background:linear-gradient(135deg,rgba(255,255,255,.75),rgba(255,226,104,.72));box-shadow:inset 0 0 18px rgba(255,225,106,.5),0 0 12px rgba(255,225,106,.25)}.binder-card-name{display:block;font:900 13px/1.14 Arial,Helvetica,sans-serif;color:#120900}.binder-card-type{display:block;margin-top:5px;font:800 10px/1.2 'Courier New',monospace;color:#5a2400;text-transform:uppercase}.binder-empty{display:block;font:800 12px/1.2 'Courier New',monospace;color:rgba(18,9,0,.55);text-transform:uppercase}.binder-controls{display:flex;justify-content:space-between;gap:10px;margin-top:12px;flex-wrap:wrap}.binder-controls button,.binder-spell-toggle{border:2px solid #ffe16a;background:rgba(0,0,0,.68);color:#ffe16a;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;padding:10px 12px;cursor:pointer;box-shadow:3px 3px 0 #000}.binder-spell-toggle{border-color:#fff3a3;color:#fff3a3;background:rgba(91,57,0,.78);width:100%;margin-top:10px}.binder-controls button:disabled{opacity:.35;cursor:not-allowed;filter:grayscale(1)}.binder-help{margin:12px 0 0;color:#f4ffe8;font:700 12px/1.35 Arial,Helvetica,sans-serif}.binder-help strong{color:#dfff73}.binder-help em{color:#fff3a3;font-style:normal;font-weight:900}@keyframes binderFlip{0%{opacity:.35;transform:rotateY(-18deg) scale(.98)}100%{opacity:1;transform:rotateY(0) scale(1)}}@media(max-width:760px){.binder-book{min-height:500px}.binder-shell{padding:12px}.binder-page{min-height:390px;padding:12px}.binder-slots{grid-template-columns:1fr}.binder-slot{min-height:54px}.binder-head{display:block}.binder-count{display:block;margin-top:6px}}
  `;
  document.head.appendChild(css);

  if (!nav.querySelector('[data-panel="binder"]')) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.panel = 'binder';
    b.textContent = 'Binder Book';
    nav.insertBefore(b, nav.querySelector('[data-panel="info"]') || nav.querySelector('[data-panel="guide"]'));
  }

  let page = 0;
  let mode = 'normal';
  let character = null;
  const numberedSlots = 100;
  const freeSlots = 50;
  const spellSlots = 50;
  const slotsPerPage = 10;
  const totalNormalSlots = numberedSlots + freeSlots;
  const totalNormalPages = Math.ceil(totalNormalSlots / slotsPerPage);
  const totalSpellPages = Math.ceil(spellSlots / slotsPerPage);
  const isSpell = item => !!(item?.spell || item?.isSpell || item?.kind === 'spell' || item?.cardType === 'spell' || item?.type === 'spell' || item?.category === 'spell' || item?.tipo === 'incantesimo');
  const normalizeCards = c => {
    const normal = [];
    const spells = [];
    const raw = [];
    if (Array.isArray(c?.cards)) raw.push(...c.cards);
    if (Array.isArray(c?.binder)) raw.push(...c.binder);
    if (Array.isArray(c?.spellCards)) raw.push(...c.spellCards.map(x => ({ ...x, spell:true })));
    if (Array.isArray(c?.spells)) raw.push(...c.spells.map(x => ({ ...x, spell:true })));
    if (Array.isArray(c?.inventory)) raw.push(...c.inventory.filter(x => x && (x.type === 'card' || x.type === 'spell' || x.card || x.number !== undefined || x.slot !== undefined || x.spellSlot !== undefined)));
    raw.forEach(item => {
      if (isSpell(item)) {
        const slot = Number(item.spellSlot ?? item.spellNumber ?? item.spellIndex ?? item.slot);
        const fallback = spells.findIndex(x => !x);
        const index = Number.isFinite(slot) && slot >= 0 && slot < spellSlots ? slot : (fallback >= 0 ? fallback : spells.length);
        if (index >= 0 && index < spellSlots) spells[index] = item;
        return;
      }
      const number = Number(item.number ?? item.slot ?? item.id);
      if (!Number.isFinite(number) || number < 0 || number >= totalNormalSlots) return;
      normal[number] = item;
    });
    return { normal, spells };
  };
  const cardRarity = card => card?.rarity || card?.rarita || card?.rank || card?.rango || '';
  const renderSlot = (i, card, slotClass, emptyText, label) => `<div class="binder-slot ${slotClass} ${card ? 'is-filled' : ''}" data-slot="${label}" data-binder-slot="${i}">${card ? `<span class="binder-card-name">${esc(card.name || card.nome || `Carta ${label}`)}</span><span class="binder-card-type">${esc(card.typeLabel || card.effectLabel || emptyText)}${cardRarity(card) ? ` · ${esc(cardRarity(card)).toUpperCase()}` : ''}</span>` : `<span class="binder-empty">${emptyText}</span>`}</div>`;
  const render = () => {
    const { normal, spells } = normalizeCards(character || {});
    const filledNumbered = normal.slice(0, numberedSlots).filter(Boolean).length;
    const filledFree = normal.slice(numberedSlots, totalNormalSlots).filter(Boolean).length;
    const filledSpells = spells.slice(0, spellSlots).filter(Boolean).length;
    const isSpellMode = mode === 'spells';
    const totalPages = isSpellMode ? totalSpellPages : totalNormalPages;
    page = Math.max(0, Math.min(totalPages - 1, page));
    const start = page * slotsPerPage;
    const end = Math.min(start + slotsPerPage, isSpellMode ? spellSlots : totalNormalSlots);
    const slots = [];
    for (let i = start; i < end; i++) {
      if (isSpellMode) {
        const label = `S${String(i + 1).padStart(2, '0')}`;
        slots.push(renderSlot(i, spells[i], 'is-spell', 'Slot incantesimo', label));
      } else {
        const card = normal[i];
        const isNumbered = i < numberedSlots;
        const label = String(i).padStart(3, '0');
        slots.push(renderSlot(i, card, isNumbered ? 'is-specific' : 'is-free', isNumbered ? 'Slot carta numerata' : 'Slot carta libera', label));
      }
    }
    const title = isSpellMode ? 'Incantesimi' : 'Binder Book';
    const rangeLabel = isSpellMode ? `Slot S${String(start + 1).padStart(2,'0')}-S${String(end).padStart(2,'0')}` : `Slot ${String(start).padStart(3,'0')}-${String(end - 1).padStart(3,'0')}`;
    panel.innerHTML = `<div class="binder-book"><div class="binder-head"><h2>${title}</h2><span class="binder-count">Numerate ${filledNumbered}/100 · Libere ${filledFree}/50 · Incantesimi ${filledSpells}/50</span></div><div class="binder-shell"><section class="binder-page ${page % 2 ? 'is-back' : ''}"><div class="binder-page-title"><strong>Pagina ${page + 1}</strong><span>${rangeLabel}</span></div><div class="binder-slots">${slots.join('')}</div></section></div><div class="binder-controls"><button type="button" data-binder-prev ${page <= 0 ? 'disabled' : ''}>← pagina prima</button><button type="button" data-binder-next ${page >= totalPages - 1 ? 'disabled' : ''}>pagina dopo →</button><button type="button" class="binder-spell-toggle" data-binder-mode>${isSpellMode ? 'Torna a numerate/libere' : 'Apri lista incantesimi'}</button></div><p class="binder-help"><strong>000-099</strong> sono carte numerate. <strong>100-149</strong> sono carte libere, estraibili e ritrasformabili. <em>S01-S50</em> sono slot incantesimo: carte con effetto, non oggetti/creature.</p></div>`;
  };
  const openBinder = async () => {
    try { character = await apiCharacter(); } catch { character = {}; }
    render();
    panel.classList.add('is-active');
  };
  nav.addEventListener('click', e => {
    const btn = e.target.closest('[data-panel="binder"]');
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    mode = 'normal';
    page = 0;
    openBinder();
  }, true);
  panel.addEventListener('click', e => {
    if (e.target.closest('[data-binder-prev]')) { page = Math.max(0, page - 1); render(); }
    if (e.target.closest('[data-binder-next]')) { page += 1; render(); }
    if (e.target.closest('[data-binder-mode]')) { mode = mode === 'spells' ? 'normal' : 'spells'; page = 0; render(); }
  });
})();
