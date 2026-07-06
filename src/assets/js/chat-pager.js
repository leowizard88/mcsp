(() => {
  const INITIAL_VISIBLE = 10;
  const STEP = 20;
  let visibleParents = INITIAL_VISIBLE;
  let applying = false;

  const style = document.createElement('style');
  style.textContent = `
    .chat-load-more{justify-self:start;margin-top:12px;border:1px solid rgba(31,28,24,.42);background:rgba(31,28,24,.84);color:#ead7b3;font:300 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.15em;text-transform:uppercase;padding:11px 13px;cursor:pointer}
    .chat-load-more:hover{transform:translateY(-1px)}
  `;
  document.head.appendChild(style);

  const applyPager = () => {
    if (applying) return;
    const list = document.querySelector('[data-chat-messages]');
    if (!list) return;
    applying = true;

    const oldButton = list.querySelector('[data-chat-load-more]');
    if (oldButton) oldButton.remove();

    const nodes = [...list.children].filter(node => node.classList?.contains('chat-message'));
    let parentCount = 0;
    let hideCurrentBranch = false;

    nodes.forEach(node => {
      const isReply = node.classList.contains('is-reply');
      if (!isReply) {
        parentCount += 1;
        hideCurrentBranch = parentCount > visibleParents;
      }
      node.hidden = hideCurrentBranch;
    });

    if (parentCount > visibleParents) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-load-more';
      button.dataset.chatLoadMore = '1';
      button.textContent = `Carica altro (${Math.min(STEP, parentCount - visibleParents)})`;
      button.addEventListener('click', () => {
        visibleParents += STEP;
        applyPager();
      });
      list.appendChild(button);
    }

    applying = false;
  };

  const boot = () => {
    applyPager();
    const list = document.querySelector('[data-chat-messages]');
    if (!list || list.dataset.chatPagerReady === '1') return;
    list.dataset.chatPagerReady = '1';
    new MutationObserver(applyPager).observe(list, { childList: true, subtree: false });
  };

  boot();
  new MutationObserver(boot).observe(document.body, { childList: true, subtree: true });
})();
