(() => {
  const insertAtCursor = (textarea, text) => {
    textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const nextFootnoteNumber = value => {
    const matches = [...String(value || '').matchAll(/\[\^(\d+)\]/g)].map(match => Number(match[1])).filter(Number.isFinite);
    return matches.length ? Math.max(...matches) + 1 : 1;
  };

  const ensureFootnotesBlock = (textarea, number) => {
    const marker = `[^${number}]: `;
    if (textarea.value.includes(marker)) return;
    const suffix = textarea.value.endsWith('\n') ? '' : '\n';
    textarea.value += `${suffix}\n${marker}testo della nota\n`;
  };

  const install = () => {
    const toolbar = document.querySelector('[data-toolbar]');
    const body = document.querySelector('[data-body]');
    if (!toolbar || !body || toolbar.querySelector('[data-cmd="footnote"]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.cmd = 'footnote';
    button.textContent = 'Nota piè';
    toolbar.appendChild(button);

    button.addEventListener('click', event => {
      event.preventDefault();
      const number = nextFootnoteNumber(body.value);
      insertAtCursor(body, `[^${number}]`);
      ensureFootnotesBlock(body, number);
      body.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  setInterval(install, 700);
  install();
})();
