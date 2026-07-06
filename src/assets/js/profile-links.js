(() => {
  const linkify = root => {
    root.querySelectorAll('.chat-author strong, .comment-meta strong').forEach(strong => {
      if (strong.dataset.profileLinked === '1') return;
      const username = strong.textContent.trim();
      if (!username || username.toLowerCase() === 'anonimo') {
        strong.dataset.profileLinked = '1';
        return;
      }
      const a = document.createElement('a');
      a.href = `/profilo/?u=${encodeURIComponent(username)}`;
      a.className = 'user-profile-link';
      a.textContent = username;
      strong.textContent = '';
      strong.appendChild(a);
      strong.dataset.profileLinked = '1';
    });
  };

  const style = document.createElement('style');
  style.textContent = `
    .user-profile-link{color:inherit;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:2px}
    .user-profile-link:hover{opacity:.68}
  `;
  document.head.appendChild(style);

  linkify(document);
  new MutationObserver(() => linkify(document)).observe(document.body, { childList: true, subtree: true });
})();
