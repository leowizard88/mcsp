(() => {
  const tokenKey = 'mancuspieAuthToken';
  const token = () => localStorage.getItem(tokenKey) || '';
  const headers = () => token() ? { authorization: `Bearer ${token()}` } : {};
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const norm = value => String(value || '').trim().toLowerCase();
  const cleanSourcePath = value => String(value || '').replace(/^\.\//, '');
  const pathNow = () => location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;

  const style = document.createElement('style');
  style.textContent = `
    .article-owner-tools{margin:22px 0 0;display:none;gap:10px;align-items:center;flex-wrap:wrap;font-family:var(--font-sans,system-ui,sans-serif)}
    .article-owner-tools.is-visible{display:flex!important}
    .article-owner-tools button{border:0;background:#8b0000;color:#fbfaf5;padding:11px 13px;font:700 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.15em;text-transform:uppercase;cursor:pointer}
    .article-owner-tools span{font-size:13px;color:#6b0000}
  `;
  document.head.appendChild(style);

  const domArticle = () => {
    const authorNode = document.querySelector('.article-format-author');
    const clone = authorNode ? authorNode.cloneNode(true) : null;
    clone?.querySelectorAll('span').forEach(span => span.remove());
    const authorLine = clone?.textContent?.trim() || '';
    const title = document.querySelector('.article-format-head h1')?.textContent?.trim() || 'articolo';
    return { author: authorLine, title };
  };

  const currentArticle = () => {
    const path = pathNow();
    const fromData = (window.MANCUSPIE_ARTICOLI || []).find(item => item.url === path || item.url === location.pathname);
    if (fromData) return { ...fromData, sourcePath: cleanSourcePath(fromData.sourcePath) };
    const slug = path.split('/').filter(Boolean).pop() || '';
    const d = domArticle();
    return { ...d, url: path, sourcePath: `src/content/testi/${slug}.md` };
  };

  const init = async () => {
    const host = document.querySelector('.article-format-head') || document.querySelector('.single-inner');
    if (!host || host.querySelector('.article-owner-tools') || !token()) return;
    const article = currentArticle();
    if (!article?.author) return;
    const response = await fetch('/api/auth', { headers: headers(), cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    const user = data.user;
    if (!response.ok || !user || !user.isRedattore || norm(user.username) !== norm(article.author)) return;

    const box = document.createElement('div');
    box.className = 'article-owner-tools is-visible';
    box.innerHTML = `<button type="button" data-delete-article>Elimina articolo</button><span data-delete-status>Visibile solo all’autore.</span>`;
    host.appendChild(box);
    const status = box.querySelector('[data-delete-status]');
    box.querySelector('[data-delete-article]').addEventListener('click', async () => {
      if (!confirm(`Eliminare davvero “${article.title}”?`)) return;
      status.textContent = 'Eliminazione...';
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers() },
        body: JSON.stringify({ action: 'delete', path: article.sourcePath })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { status.textContent = result.error || 'Eliminazione fallita.'; return; }
      status.textContent = 'Eliminato. Deploy in corso.';
      setTimeout(() => { location.href = '/archivio/'; }, 1200);
    });
  };

  init().catch(() => {});
})();
