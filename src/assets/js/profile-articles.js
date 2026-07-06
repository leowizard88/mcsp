(() => {
  const norm = value => String(value || '').trim().toLowerCase();
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let last = '';

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

  const render = () => {
    const root = document.querySelector('[data-profile-root]');
    const username = root?.querySelector('.profile-username')?.textContent?.trim() || '';
    const card = root?.querySelector('.profile-card');
    if (!root || !username || !card || !window.MANCUSPIE_ARTICOLI) return;
    if (last === username && card.querySelector('.profile-articles')) return;
    last = username;
    card.querySelector('.profile-articles')?.remove();
    const items = window.MANCUSPIE_ARTICOLI.filter(item => norm(item.author) === norm(username));
    const section = document.createElement('section');
    section.className = 'profile-articles';
    section.innerHTML = `<h2>Articoli scritti:</h2>${items.length ? `<ul class="profile-articles-list">${items.map(item => `<li><a href="${esc(item.url)}"><strong>${esc(item.title)}</strong><span>${esc(item.tipo || '')}${item.rubrica ? ' / ' + esc(item.rubrica) : ''}${item.date ? ' / ' + esc(item.date) : ''}</span></a></li>`).join('')}</ul>` : '<p class="profile-status">Nessun articolo pubblicato.</p>'}`;
    card.appendChild(section);
  };

  setInterval(render, 900);
  render();
})();
