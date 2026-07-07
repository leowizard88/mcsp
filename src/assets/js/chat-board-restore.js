(() => {
  const isHome = () => !!document.querySelector('#home') || location.pathname === '/' || location.pathname === '/index.html';
  if (!isHome()) return;

  const apiUrl = '/api/chat';
  const nameKey = 'mancuspiePublicName';
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const cssEsc = value => window.CSS?.escape ? CSS.escape(String(value || '')) : String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  const formatTime = iso => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  };

  const ensurePanel = () => {
    if (!isHome()) return null;
    let panel = document.querySelector('#chat');
    if (panel) return panel;

    const main = document.querySelector('.site-main');
    const projects = document.querySelector('#progetti');
    if (!main) return null;

    panel = document.createElement('section');
    panel.id = 'chat';
    panel.className = 'panel content-panel chat-panel';
    panel.innerHTML = `
      <div class="chat-board" data-chat-board>
        <p class="section-kicker">06</p>
        <h2>Bacheca</h2>
        <p>Scrivi un consiglio, una bestemmia, un piccolo segreto, una richiesta di aiuto, il nome del tuo cane, il tuo nome, il vero motivo, una bugia, una teoria sulla logica preposizionale ecc</p>
        <form class="chat-form" data-chat-form>
          <input data-chat-name type="text" maxlength="24" placeholder="nickname" autocomplete="nickname" required>
          <textarea data-chat-text maxlength="260" placeholder="scrivi qui" required></textarea>
          <button type="submit">Invia</button>
        </form>
        <div class="chat-messages" data-chat-messages aria-live="polite"></div>
      </div>
      <footer class="footer"><span>© MANCUSPIE</span><span></span><span></span></footer>`;

    if (projects && projects.parentNode === main) main.insertBefore(panel, projects.nextSibling);
    else main.appendChild(panel);
    return panel;
  };

  const start = () => {
    if (!isHome()) return;
    if (window.MANCUSPIE_CHAT_READY) return;
    const panel = ensurePanel();
    if (!panel) return;
    window.MANCUSPIE_CHAT_READY = true;
    panel.setAttribute('data-chat-restored', 'true');

    const form = panel.querySelector('[data-chat-form]');
    const nameInput = panel.querySelector('[data-chat-name]');
    const textInput = panel.querySelector('[data-chat-text]');
    const list = panel.querySelector('[data-chat-messages]');
    if (!form || !nameInput || !textInput || !list) return;

    const openBranches = new Set();
    const savedName = localStorage.getItem(nameKey) || '';
    if (savedName) {
      nameInput.value = savedName;
      nameInput.readOnly = true;
      nameInput.classList.add('is-locked');
      nameInput.title = 'Nickname già scelto';
    }

    const lockName = name => {
      if (!localStorage.getItem(nameKey)) localStorage.setItem(nameKey, name);
      nameInput.value = name;
      nameInput.readOnly = true;
      nameInput.classList.add('is-locked');
      nameInput.title = 'Nickname già scelto';
    };

    const replyForm = id => `
      <form class="chat-reply is-open" data-chat-reply-form="${esc(id)}">
        <input data-chat-reply-name type="text" maxlength="24" placeholder="nickname" value="${esc(localStorage.getItem(nameKey) || '')}" ${localStorage.getItem(nameKey) ? 'readonly class="is-locked"' : ''} required>
        <textarea data-chat-reply-text maxlength="260" placeholder="rispondi qui" required></textarea>
        <button type="submit">Rispondi</button>
      </form>`;

    const renderMessage = (item, childrenByParent, depth = 0) => {
      if (!item.id) item.id = `legacy-${item.time || ''}-${item.name || ''}-${item.text || ''}`;
      const children = childrenByParent.get(item.id) || [];
      const margin = depth ? Math.min(depth * 24, 112) : 0;
      const collapsed = depth >= 4 && children.length && !openBranches.has(item.id);
      const childHtml = collapsed ? '' : children.map(child => renderMessage(child, childrenByParent, depth + 1)).join('');
      const branchButton = children.length && depth >= 4 ? `<button class="chat-branch-toggle" type="button" data-chat-branch-toggle="${esc(item.id)}">${openBranches.has(item.id) ? 'Chiudi ramo' : `Mostra ${children.length} risposte`}</button>` : '';
      const avatar = item.avatar ? `<img class="chat-avatar" src="${esc(item.avatar)}" alt="">` : '';
      return `<article class="chat-message${depth ? ' is-reply' : ''}" style="${depth ? `margin-left:${margin}px` : ''}"><div class="chat-author">${avatar}<strong>${esc(item.name || 'Anonimo')}</strong><time>${esc(formatTime(item.time))}</time></div><p>${esc(item.text || '')}</p>${branchButton}${replyForm(item.id)}</article>${childHtml}`;
    };

    const render = messages => {
      const items = Array.isArray(messages) ? messages : [];
      if (!items.length) { list.innerHTML = '<div class="chat-message"><p>Nessun messaggio ancora.</p></div>'; return; }
      const childrenByParent = new Map();
      items.forEach(item => {
        if (!item.id) item.id = `legacy-${item.time || ''}-${item.name || ''}-${item.text || ''}`;
        const key = item.parentId || '';
        if (!childrenByParent.has(key)) childrenByParent.set(key, []);
        childrenByParent.get(key).push(item);
      });
      const parents = (childrenByParent.get('') || []).slice().reverse();
      list.innerHTML = parents.map(parent => renderMessage(parent, childrenByParent, 0)).join('');
    };

    const load = async () => {
      try {
        const response = await fetch(apiUrl, { cache:'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'errore chat');
        if (!document.activeElement?.closest?.('.chat-reply')) render(data.messages);
      } catch (error) {
        list.innerHTML = `<div class="chat-message"><p class="chat-error">Chat non disponibile: ${esc(error.message)}</p></div>`;
      }
    };

    const sendMessage = async ({ name, text, parentId }) => {
      const response = await fetch(apiUrl, { method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ name, text, parentId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'errore invio');
      render(data.messages);
    };

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const lockedName = localStorage.getItem(nameKey);
      const name = (lockedName || nameInput.value).trim().slice(0, 24);
      const text = textInput.value.trim().slice(0, 260);
      if (!name || !text) return;
      if (!lockedName) lockName(name);
      form.querySelector('button').disabled = true;
      try { await sendMessage({ name, text }); textInput.value = ''; }
      catch (error) { list.innerHTML = `<div class="chat-message"><p class="chat-error">Invio fallito: ${esc(error.message)}</p></div>`; }
      finally { form.querySelector('button').disabled = false; }
    });

    panel.addEventListener('click', event => {
      const branchButton = event.target.closest('[data-chat-branch-toggle]');
      if (!branchButton) return;
      const id = branchButton.dataset.chatBranchToggle;
      openBranches.has(id) ? openBranches.delete(id) : openBranches.add(id);
      load();
    });

    panel.addEventListener('submit', async event => {
      const reply = event.target.closest('[data-chat-reply-form]');
      if (!reply) return;
      event.preventDefault();
      const nameField = reply.querySelector('[data-chat-reply-name]');
      const textField = reply.querySelector('[data-chat-reply-text]');
      const lockedName = localStorage.getItem(nameKey);
      const name = (lockedName || nameField.value).trim().slice(0, 24);
      const text = textField.value.trim().slice(0, 260);
      const parentId = reply.dataset.chatReplyForm;
      if (!name || !text || !parentId) return;
      if (!lockedName) lockName(name);
      try { openBranches.add(parentId); await sendMessage({ name, text, parentId }); }
      catch (error) { list.innerHTML = `<div class="chat-message"><p class="chat-error">Invio fallito: ${esc(error.message)}</p></div>`; }
    });

    load();
    setInterval(load, 5000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();