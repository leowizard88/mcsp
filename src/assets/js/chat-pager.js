(() => {
  const INITIAL_VISIBLE = 10;
  const STEP = 20;
  let visibleParents = INITIAL_VISIBLE;
  let lastSignature = '';

  const style = document.createElement('style');
  style.textContent = `
    .chat-load-more{justify-self:start;margin-top:14px;border:1px solid rgba(31,28,24,.42);background:rgba(31,28,24,.84);color:#ead7b3;font:300 10px/1 var(--font-sans,system-ui,sans-serif);letter-spacing:.15em;text-transform:uppercase;padding:11px 13px;cursor:pointer}
    .chat-load-more:hover{transform:translateY(-1px)}
    .chat-message[hidden]{display:none!important}
  `;
  document.head.appendChild(style);

  const getList = () => document.querySelector('[data-chat-messages]');
  const messages = list => [...list.children].filter(node => node.classList?.contains('chat-message'));
  const signatureOf = nodes => nodes.map(node => node.querySelector('[data-chat-reply-toggle]')?.dataset.chatReplyToggle || node.textContent.slice(0, 40)).join('|');

  const applyPager = () => {
    const list = getList();
    if (!list) return;

    const oldButton = list.querySelector('[data-chat-load-more]');
    if (oldButton) oldButton.remove();

    const nodes = messages(list);
    if (!nodes.length) return;

    const signature = signatureOf(nodes);
    if (signature !== lastSignature) {
      lastSignature = signature;
      visibleParents = Math.max(INITIAL_VISIBLE, Math.min(visibleParents, nodes.length));
    }

    let parentCount = 0;
    let hideBranch = false;
    nodes.forEach(node => {
      const isReply = node.classList.contains('is-reply');
      if (!isReply) {
        parentCount += 1;
        hideBranch = parentCount > visibleParents;
      }
      node.hidden = hideBranch;
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
      }, { once: true });
      list.appendChild(button);
    }
  };

  document.addEventListener('click', event => {
    if (event.target.closest('[data-chat-reply-toggle], [data-chat-branch-toggle]')) {
      setTimeout(applyPager, 0);
    }
  });

  setInterval(applyPager, 1200);
  setTimeout(applyPager, 500);
  setTimeout(applyPager, 1600);
})();
