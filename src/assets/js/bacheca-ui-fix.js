(() => {
  const emptyText = 'Nessun messaggio ancora.';
  const addStyle = () => {
    if (document.querySelector('[data-bacheca-ui-fix-style]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-bacheca-ui-fix-style', '');
    style.textContent = `
      .chat-message:has(> .chat-reply.is-open) > .chat-reply-toggle {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    document.head.appendChild(style);
  };

  const isEmptyState = node => (node?.textContent || '').trim() === emptyText;
  const isUsefulMessagesHtml = list => {
    if (!list) return false;
    const text = (list.textContent || '').trim();
    if (!text || text === emptyText) return false;
    if (list.querySelector('.chat-error')) return false;
    return !!list.querySelector('.chat-message');
  };

  const protectBoard = () => {
    const list = document.querySelector('[data-chat-messages]');
    if (!list || list.dataset.bachecaUiFixed === 'true') return;
    list.dataset.bachecaUiFixed = 'true';

    let lastGoodHtml = isUsefulMessagesHtml(list) ? list.innerHTML : '';

    const observer = new MutationObserver(() => {
      if (isUsefulMessagesHtml(list)) {
        lastGoodHtml = list.innerHTML;
        return;
      }
      if (lastGoodHtml && isEmptyState(list)) {
        list.innerHTML = lastGoodHtml;
      }
    });

    observer.observe(list, { childList: true, subtree: true, characterData: true });
  };

  const start = () => {
    addStyle();
    protectBoard();
    setInterval(protectBoard, 1200);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();