(() => {
  const token = localStorage.getItem('mancuspieAuthToken') || '';
  const normalize = value => String(value || '').trim().toLowerCase();
  const cleanPath = value => String(value || '').replace(/^\.\//, '');
  const style = document.createElement('style');
  style.textContent = `
    .article-owner-tools a[data-edit-article]{border:0;background:#050505;color:#fbfaf5;padding:11px 13px;font:700 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.15em;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-block}
  `;
  document.head.appendChild(style);

  const run = async () => {
    const head = document.querySelector('[data-article-head]');
    const tools = document.querySelector('[data-inline-owner-tools]');
    if (!head || !tools || tools.querySelector('[data-edit-article]') || !token) return;
    const author = head.dataset.articleAuthor || '';
    const path = cleanPath(head.dataset.articlePath || '');
    if (!author || !path) return;
    const response = await fetch('/api/auth', { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    const user = data.user;
    if (!response.ok || !user || !user.isRedattore || normalize(user.username) !== normalize(author)) return;
    const link = document.createElement('a');
    link.dataset.editArticle = '1';
    link.href = `/scrivi/?edit=${encodeURIComponent(path)}`;
    link.textContent = 'Modifica articolo';
    const deleteButton = tools.querySelector('[data-inline-delete-article]');
    tools.insertBefore(link, deleteButton || tools.firstChild);
    tools.hidden = false;
  };
  setTimeout(() => run().catch(() => {}), 200);
  setTimeout(() => run().catch(() => {}), 1200);
})();
