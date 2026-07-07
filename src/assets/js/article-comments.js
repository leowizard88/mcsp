(() => {
  const root = document.querySelector('[data-article-comments]');
  if (!root) return;

  const form = root.querySelector('[data-comment-form]');
  const list = root.querySelector('[data-comments-list]');
  const status = root.querySelector('[data-comments-status]');
  const token = () => localStorage.getItem('mancuspieAuthToken') || '';
  const headers = () => token() ? { authorization: `Bearer ${token}` } : {};
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const articlePath = root.getAttribute('data-article-path') || location.pathname;
  const sourcePath = document.querySelector('[data-article-head]')?.getAttribute('data-article-path') || '';
  const legacyPath = (() => {
    const file = String(sourcePath || '').split('/').pop() || '';
    const slug = file.replace(/\.md$/i, '');
    return slug ? `/${slug}/` : '';
  })();
  const aliases = [legacyPath].filter(path => path && path !== articlePath);
  let comments = [];

  const endpoint = () => `/api/comments?path=${encodeURIComponent(articlePath)}${aliases.length ? `&aliases=${encodeURIComponent(aliases.join(','))}` : ''}&v=${Date.now()}`;
  const dateLabel = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('it-IT', { dateStyle:'short', timeStyle:'short' });
  };
  const renderComment = item => {
    const avatar = item.avatar ? `<img class="comment-avatar" src="${esc(item.avatar)}" alt="">` : '';
    return `<article class="comment-card${item.parentId ? ' is-reply' : ''}"><p class="comment-meta">${avatar}<strong>${esc(item.name || 'Anonimo')}</strong>${item.time ? `<time>${esc(dateLabel(item.time))}</time>` : ''}</p><p class="comment-text">${esc(item.text || '')}</p></article>`;
  };
  const render = () => {
    list.innerHTML = comments.length ? comments.map(renderComment).join('') : '<p class="comments-status">Nessun commento ancora.</p>';
  };
  const load = async () => {
    status.textContent = 'Caricamento commenti...';
    const response = await fetch(endpoint(), { headers: headers(), cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Commenti non disponibili.');
    comments = Array.isArray(data.comments) ? data.comments : [];
    status.textContent = '';
    render();
  };
  const publish = async event => {
    event.preventDefault();
    status.textContent = 'Pubblicazione...';
    const text = form.text.value;
    const response = await fetch('/api/comments', { method:'POST', headers:{ 'content-type':'application/json', ...headers() }, body:JSON.stringify({ path: articlePath, aliases, text }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { status.textContent = data.error || 'Pubblicazione fallita.'; return; }
    form.reset();
    comments = Array.isArray(data.comments) ? data.comments : [];
    status.textContent = '';
    render();
  };

  form?.addEventListener('submit', publish);
  load().catch(error => { status.textContent = error.message; });
})();
