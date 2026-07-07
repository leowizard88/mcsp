(() => {
  const normalize = value => String(value || '').trim().toLowerCase();
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  let cache = null;

  const fixedUrl = item => {
    const url = String(item?.url || '').trim();
    if (url && url !== '/') return url;
    const path = String(item?.sourcePath || '').trim();
    const file = path.split('/').pop() || '';
    const slug = file.replace(/\.md$/i, '');
    return slug ? `/content/testi/${slug}/` : '/archivio/';
  };

  const getArticles = async () => {
    if (cache) return cache;
    if (Array.isArray(window.MANCUSPIE_ARTICOLI)) {
      cache = window.MANCUSPIE_ARTICOLI;
      return cache;
    }
    const res = await fetch(`/articoli.json?v=${Date.now()}`, { cache: 'no-store' });
    cache = res.ok ? await res.json() : [];
    window.MANCUSPIE_ARTICOLI = cache;
    return cache;
  };

  const draw = async () => {
    const root = document.querySelector('[data-profile-root]');
    const username = root?.querySelector('.profile-username')?.textContent?.trim() || '';
    const card = root?.querySelector('.profile-card');
    if (!username || !card) return;

    if (card.querySelector('.profile-articles-list a')) return;

    const articles = await getArticles();
    const items = articles.filter(item => normalize(item.author) === normalize(username));
    if (!items.length) return;

    const existing = card.querySelector('.profile-articles');
    const section = existing || document.createElement('section');
    section.className = 'profile-articles';
    const list = items.map(item => `<li><a href="${escapeHtml(fixedUrl(item))}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.tipo || '')}${item.rubrica ? ' / ' + escapeHtml(item.rubrica) : ''}${item.date ? ' / ' + escapeHtml(item.date) : ''}</span></a></li>`).join('');
    section.innerHTML = `<h2>Articoli scritti:</h2><ul class="profile-articles-list">${list}</ul>`;
    if (!existing) card.appendChild(section);
  };

  const start = () => setTimeout(() => draw().catch(() => {}), 700);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
