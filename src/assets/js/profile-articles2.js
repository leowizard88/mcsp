(() => {
  const normalize = value => String(value || '').trim().toLowerCase();
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  let lastKey = '';
  let cache = null;

  const style = document.createElement('style');
  style.textContent = `
    .profile-articles{grid-column:1/-1;margin-top:18px;padding-top:18px;border-top:1px solid rgba(240,220,192,.18)}
    .profile-articles h2{margin:0 0 14px;color:#f0dcc0;font:300 clamp(28px,4vw,46px)/.95 var(--font-serif,Georgia,serif);letter-spacing:-.04em}
    .profile-articles-list{display:grid;gap:9px;margin:0;padding:0;list-style:none}
    .profile-articles-list a{display:grid;gap:4px;text-decoration:none;color:#f0dcc0;background:rgba(30,0,0,.28);padding:12px}
    .profile-articles-list strong{font:300 22px/1.05 var(--font-serif,Georgia,serif)}
    .profile-articles-list span{font:300 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:rgba(240,220,192,.62)}
  `;
  document.head.appendChild(style);

  const getArticles = async () => {
    if (cache) return cache;
    if (Array.isArray(window.MANCUSPIE_ARTICOLI)) {
      cache = window.MANCUSPIE_ARTICOLI;
      return cache;
    }
    const res = await fetch('/articoli.json', { cache: 'no-store' });
    cache = res.ok ? await res.json() : [];
    window.MANCUSPIE_ARTICOLI = cache;
    return cache;
  };

  const draw = async () => {
    const root = document.querySelector('[data-profile-root]');
    const username = root?.querySelector('.profile-username')?.textContent?.trim() || '';
    const card = root?.querySelector('.profile-card');
    if (!username || !card) return;
    const articles = await getArticles();
    const key = `${username}-${articles.length}`;
    if (lastKey === key && card.querySelector('.profile-articles')) return;
    lastKey = key;
    const items = articles.filter(item => normalize(item.author) === normalize(username));
    card.querySelector('.profile-articles')?.remove();
    const section = document.createElement('section');
    section.className = 'profile-articles';
    const list = items.map(item => `<li><a href="${escapeHtml(item.url)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.tipo || '')}${item.rubrica ? ' / ' + escapeHtml(item.rubrica) : ''}${item.date ? ' / ' + escapeHtml(item.date) : ''}</span></a></li>`).join('');
    section.innerHTML = `<h2>Articoli scritti:</h2>${items.length ? `<ul class="profile-articles-list">${list}</ul>` : '<p class="profile-status">Nessun articolo pubblicato.</p>'}`;
    card.appendChild(section);
  };

  setInterval(() => draw().catch(() => {}), 1000);
  draw().catch(() => {});
})();
