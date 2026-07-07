(() => {
  const apiUrl = '/api/chat';
  const nameKey = 'mancuspiePublicName';
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const time = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  };

  const addStyles = () => {
    if (document.querySelector('[data-bacheca-failsafe-style]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-bacheca-failsafe-style', '');
    style.textContent = `.chat-panel{display:grid!important;align-items:center!important;background:#ead7b3!important}.chat-board{position:relative;z-index:5;width:min(900px,88vw);margin:0 auto;border-top:1px solid rgba(31,28,24,.28);padding-top:clamp(26px,4vw,52px)}.chat-board h2{margin:0 0 22px;font-family:var(--font-serif,Georgia,serif);font-size:clamp(56px,9vw,132px);line-height:.86;font-weight:300}.chat-board p{max-width:620px;margin:0 0 24px;font-size:clamp(19px,2vw,30px);line-height:1.18}.chat-form{display:grid;grid-template-columns:minmax(120px,210px) 1fr auto;gap:10px;align-items:end}.chat-form input,.chat-form textarea{width:100%;border:1px solid rgba(31,28,24,.30);background:rgba(234,215,179,.18);color:#120d08;font:300 14px/1.2 var(--font-sans,system-ui,sans-serif);letter-spacing:.04em;padding:13px 12px;border-radius:0;outline:none}.chat-form textarea{min-height:44px;resize:vertical}.chat-form button,.chat-reply-toggle{border:1px solid rgba(31,28,24,.42);background:rgba(31,28,24,.84);color:#ead7b3;font:300 11px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.16em;text-transform:uppercase;padding:15px 16px;cursor:pointer}.chat-messages{margin-top:26px;display:grid;gap:12px}.chat-message{border-top:1px solid rgba(31,28,24,.20);padding-top:12px}.chat-author{display:flex;align-items:center;gap:8px;margin-bottom:8px}.chat-avatar{width:34px;height:34px;object-fit:cover;border:1px solid rgba(31,28,24,.32);background:rgba(31,28,24,.08)}.chat-message strong{display:inline-block;margin-right:10px;font:300 12px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.14em;text-transform:uppercase}.chat-message time{font:300 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.10em;opacity:.55}.chat-message p{margin:8px 0 0;font-size:clamp(19px,2vw,28px);line-height:1.18;max-width:none}.chat-error{color:#5a0000!important}@media(max-width:760px){.chat-board{width:100%}.chat-form{grid-template-columns:1fr}.chat-avatar{width:30px;height:30px}}`;
    document.head.appendChild(style);
  };

  const ensurePanel = () => {
    if (!document.querySelector('#home')) return null;
    let panel = document.querySelector('#chat');
    if (panel) return panel;
    const main = document.querySelector('.site-main');
    const projects = document.querySelector('#progetti');
    if (!main) return null;
    panel = document.createElement('section');
    panel.id = 'chat';
    panel.className = 'panel content-panel chat-panel';
    panel.innerHTML = `<div class="chat-board" data-chat-board><p class="section-kicker">06</p><h2>Bacheca</h2><p>Scrivi un consiglio, una bestemmia, un piccolo segreto, una richiesta di aiuto, il nome del tuo cane, il tuo nome, il vero motivo, una bugia, una teoria sulla logica preposizionale ecc</p><form class="chat-form" data-chat-form><input data-chat-name type="text" maxlength="24" placeholder="nickname" autocomplete="nickname" required><textarea data-chat-text maxlength="260" placeholder="scrivi qui" required></textarea><button type="submit">Invia</button></form><div class="chat-messages" data-chat-messages aria-live="polite"></div></div>`;
    if (projects) main.insertBefore(panel, projects.nextSibling);
    else main.appendChild(panel);
    return panel;
  };

  const start = () => {
    addStyles();
    const panel = ensurePanel();
    if (!panel || panel.dataset.bachecaFailsafe === 'true') return;
    panel.dataset.bachecaFailsafe = 'true';
    panel.style.display = 'grid';
    const form = panel.querySelector('[data-chat-form]');
    const nameInput = panel.querySelector('[data-chat-name]');
    const textInput = panel.querySelector('[data-chat-text]');
    const list = panel.querySelector('[data-chat-messages]');
    if (!form || !nameInput || !textInput || !list) return;
    const savedName = localStorage.getItem(nameKey) || '';
    if (savedName) { nameInput.value = savedName; nameInput.readOnly = true; nameInput.classList.add('is-locked'); }
    const render = messages => {
      const items = Array.isArray(messages) ? messages.slice().reverse() : [];
      list.innerHTML = items.length ? items.map(item => `<article class="chat-message"><div class="chat-author">${item.avatar ? `<img class="chat-avatar" src="${esc(item.avatar)}" alt="">` : ''}<strong>${esc(item.name || 'Anonimo')}</strong><time>${esc(time(item.time))}</time></div><p>${esc(item.text || '')}</p></article>`).join('') : '<div class="chat-message"><p>Nessun messaggio ancora.</p></div>';
    };
    const load = async () => {
      try {
        const response = await fetch(apiUrl, { cache:'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'errore chat');
        render(data.messages);
      } catch (error) {
        list.innerHTML = `<div class="chat-message"><p class="chat-error">Chat non disponibile: ${esc(error.message)}</p></div>`;
      }
    };
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const name = (localStorage.getItem(nameKey) || nameInput.value).trim().slice(0, 24);
      const text = textInput.value.trim().slice(0, 260);
      if (!name || !text) return;
      if (!localStorage.getItem(nameKey)) localStorage.setItem(nameKey, name);
      await fetch(apiUrl, { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ name, text }) }).then(r => r.json());
      textInput.value = '';
      await load();
    });
    load();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
