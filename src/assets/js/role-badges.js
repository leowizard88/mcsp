(() => {
  const cache = new Map();

  const style = document.createElement('style');
  style.textContent = `
    .user-role-badge{display:inline-block;margin-left:6px;vertical-align:middle;border:1px solid currentColor;padding:2px 4px;font:700 8px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;opacity:.55}
    .user-role-badge.is-redattore{opacity:.9;background:#050505;color:#ead7b3;border-color:#050505}
    .comment-meta .user-role-badge{font-size:8px;margin-left:4px}
  `;
  document.head.appendChild(style);

  const fetchRole = async username => {
    const key = username.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    const promise = fetch(`/api/auth?username=${encodeURIComponent(username)}`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => data?.user?.role || 'user')
      .catch(() => 'user');
    cache.set(key, promise);
    return promise;
  };

  const labelTarget = strong => strong.querySelector('.user-profile-link') || strong;

  const apply = async root => {
    const nodes = [...root.querySelectorAll('.chat-author strong, .comment-meta strong')];
    await Promise.all(nodes.map(async strong => {
      if (strong.dataset.roleBadged === '1') return;
      const target = labelTarget(strong);
      const username = target.textContent.trim();
      if (!username || username.toLowerCase() === 'anonimo') {
        strong.dataset.roleBadged = '1';
        return;
      }
      const role = await fetchRole(username);
      if (strong.querySelector('.user-role-badge')) return;
      const badge = document.createElement('span');
      badge.className = `user-role-badge${role === 'redattore' ? ' is-redattore' : ''}`;
      badge.textContent = role === 'redattore' ? 'red' : 'user';
      strong.appendChild(badge);
      strong.dataset.roleBadged = '1';
    }));
  };

  apply(document);
  new MutationObserver(() => apply(document)).observe(document.body, { childList: true, subtree: true });
})();
