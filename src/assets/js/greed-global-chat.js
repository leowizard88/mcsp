(() => {
  const game = document.querySelector('[data-greed-game]');
  if (!game) return;
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const esc = s => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const fmtTime = value => {
    const d = new Date(value || Date.now());
    return Number.isFinite(d.getTime()) ? d.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }) : '';
  };
  const css = document.createElement('style');
  css.textContent = `
    .gi-chat{position:fixed;right:14px;bottom:18px;z-index:44;width:min(430px,calc(100vw - var(--side,44px) - 28px));font-family:Arial,Helvetica,sans-serif;color:#f4ffe8;text-shadow:1px 1px 0 #000;pointer-events:auto}.gi-chat-log{height:310px;max-height:34vh;overflow:auto;-webkit-overflow-scrolling:touch;padding:0 0 9px;display:flex;flex-direction:column;gap:5px;mask-image:linear-gradient(to bottom,transparent 0,#000 18px,#000 100%)}.gi-chat-line{font:700 13px/1.28 Arial,Helvetica,sans-serif;background:rgba(0,0,0,.16);border-left:2px solid rgba(255,255,255,.22);padding:3px 6px;word-break:break-word}.gi-chat-line.global{color:#f4ffe8}.gi-chat-line.info{color:#dfff73;border-left-color:#dfff73}.gi-chat-line.good{color:#66ff86;border-left-color:#66ff86}.gi-chat-line.bad{color:#ff5a5a;border-left-color:#ff5a5a}.gi-chat-line.system{color:#9ecbff;border-left-color:#9ecbff;font-size:15px;line-height:1.3;background:rgba(0,0,0,.28);padding:7px 8px}.gi-chat-line time{opacity:.62;font-size:10px;margin-right:4px}.gi-chat-line strong{color:#ffe16a;font-weight:900}.gi-chat-form{display:flex;gap:6px;align-items:center;background:transparent}.gi-chat-input{flex:1;min-width:0;border:0;border-bottom:1px solid rgba(255,255,255,.48);background:rgba(0,0,0,.18);color:#fff;padding:7px 5px;font:700 13px/1 Arial,Helvetica,sans-serif;outline:none;text-shadow:1px 1px 0 #000}.gi-chat-input::placeholder{color:rgba(255,255,255,.62)}.gi-chat-send{border:0;background:transparent;color:#dfff73;font:900 12px/1 'Courier New',monospace;text-transform:uppercase;cursor:pointer;padding:5px 0;text-shadow:1px 1px 0 #000}.gi-chat-send:disabled{opacity:.42;cursor:not-allowed}.gi-chat-toggle{display:none}@media(max-width:760px){.gi-chat{right:8px;bottom:10px;width:calc(100vw - var(--side,38px) - 18px);z-index:86}.gi-chat-log{height:210px;max-height:28vh}.gi-chat-line{font-size:12px}.gi-chat-line.system{font-size:14px}.gi-chat-input{font-size:12px}body.menu-open .gi-chat{display:none}}
  `;
  document.head.appendChild(css);
  const box = document.createElement('section');
  box.className = 'gi-chat';
  box.innerHTML = `<div class="gi-chat-log" data-gi-chat-log></div><form class="gi-chat-form" data-gi-chat-form><input class="gi-chat-input" data-gi-chat-input maxlength="360" placeholder="chat globale"><button class="gi-chat-send" type="submit">Invia</button></form>`;
  game.appendChild(box);
  const log = box.querySelector('[data-gi-chat-log]');
  const form = box.querySelector('[data-gi-chat-form]');
  const input = box.querySelector('[data-gi-chat-input]');
  let globalMessages = [];
  let localMessages = [];
  let previousCharacter = null;
  const introKey = 'greedGlobalChatIntroV2';
  const firstEnterKey = 'greedGlobalChatFirstEnterV2';
  const pigNotifyKey = 'greedGlobalChatPigNotifyV1';
  const local = (text, tone = 'info', id = '') => {
    const msg = { id:id || `local-${Date.now()}-${Math.random()}`, local:true, kind:tone, text, createdAt:new Date().toISOString() };
    localMessages.push(msg);
    localMessages = localMessages.slice(-50);
    render();
  };
  const render = () => {
    const all = [...globalMessages.map(m => ({ ...m, kind:'global' })), ...localMessages]
      .filter(m => m?.text)
      .slice(-95)
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    log.innerHTML = all.map(m => {
      const cls = m.kind === 'good' ? 'good' : m.kind === 'bad' ? 'bad' : m.kind === 'system' ? 'system' : m.kind === 'info' ? 'info' : 'global';
      const author = m.author ? `<strong>${esc(m.author)}:</strong> ` : '';
      return `<div class="gi-chat-line ${cls}"><time>${fmtTime(m.createdAt)}</time>${author}${esc(m.text)}</div>`;
    }).join('');
    log.scrollTop = log.scrollHeight;
  };
  const fetchChat = async () => {
    const res = await fetch('/api/hxh-chat', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore chat');
    globalMessages = Array.isArray(data.messages) ? data.messages : [];
    render();
  };
  const postChat = async text => {
    const res = await fetch('/api/hxh-chat', { method:'POST', headers:{ 'content-type':'application/json', authorization:`Bearer ${token()}` }, body:JSON.stringify({ text }), cache:'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Errore chat');
    globalMessages = Array.isArray(data.messages) ? data.messages : [...globalMessages, data.message].filter(Boolean);
    render();
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    form.querySelector('button').disabled = true;
    try { await postChat(text); } catch (err) { local(err.message, 'bad'); }
    finally { form.querySelector('button').disabled = false; input.focus(); }
  });
  const cardName = c => c?.name || c?.nome || 'una carta';
  const inventoryName = i => i?.name || i?.nome || 'un oggetto';
  const isPigCard = card => card?.id === 'free-greed-island-pig' || cardName(card) === 'Maiale di Greed Island';
  const hasPigCard = c => (c?.cards || []).some(isPigCard);
  const diffCharacter = c => {
    if (!c) return;
    if (!localStorage.getItem(introKey)) {
      localStorage.setItem(introKey, '1');
      local('Questa è la chat globale per giocatori e notifiche', 'system', 'global-chat-intro-once');
    }
    if (!localStorage.getItem(firstEnterKey) && c.ready) {
      localStorage.setItem(firstEnterKey, '1');
      local(`Benvenuto ${c.nome || 'giocatore'}: sei entrato in Greed Island.`, 'good');
    }
    if (hasPigCard(c) && !localStorage.getItem(pigNotifyKey)) {
      localStorage.setItem(pigNotifyKey, '1');
      local('Hai ottenuto la carta Maiale di Greed Island!', 'good');
    }
    if (previousCharacter) {
      const oldCards = new Set((previousCharacter.cards || []).map(x => x?.id || `${x?.number}-${cardName(x)}`));
      (c.cards || []).forEach(card => {
        const id = card?.id || `${card?.number}-${cardName(card)}`;
        if (!oldCards.has(id)) local(`Hai ottenuto la carta ${cardName(card)}!`, 'good');
      });
      const oldItems = new Set((previousCharacter.inventory || []).map(x => x?.id || inventoryName(x)));
      (c.inventory || []).forEach(item => {
        const id = item?.id || inventoryName(item);
        if (!oldItems.has(id)) local(`Hai ottenuto ${inventoryName(item)}.`, 'good');
      });
      if (!previousCharacter.sleepActive && c.sleepActive) local('Stai dormendo! Azioni bloccate e vulnerabilità alta.', 'bad');
      if (previousCharacter.sleepActive && !c.sleepActive) local('Ti sei svegliato.', 'good');
      if (!previousCharacter.exhaustionActive && c.exhaustionActive) local('Sei in esaurimento.', 'bad');
      if ((previousCharacter.health?.corpo || 0) > (c.health?.corpo || 0)) local('Hai subito danni.', 'bad');
    }
    previousCharacter = JSON.parse(JSON.stringify(c));
  };
  window.addEventListener('greed-character-updated', e => diffCharacter(e.detail));
  const initCharacter = async () => {
    try {
      const res = await fetch('/api/hxh-character', { headers:{ authorization:`Bearer ${token()}` }, cache:'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.character) diffCharacter(data.character);
    } catch {}
  };
  fetchChat().catch(() => render());
  initCharacter();
  setInterval(() => fetchChat().catch(() => {}), 6000);
})();
