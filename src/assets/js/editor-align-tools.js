(() => {
  const wrapSelection = (textarea, before, after) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || 'testo';
    textarea.setRangeText(`${before}${selected}${after}`, start, end, 'select');
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const install = () => {
    const toolbar = document.querySelector('[data-toolbar]');
    const body = document.querySelector('[data-body]');
    if (!toolbar || !body || toolbar.querySelector('[data-align-tools]')) return;
    const group = document.createElement('span');
    group.dataset.alignTools = '1';
    group.style.display = 'contents';
    group.innerHTML = `
      <button type="button" data-align="left">Sinistra</button>
      <button type="button" data-align="center">Centro</button>
      <button type="button" data-align="right">Destra</button>
      <button type="button" data-align="justify">Giustificato</button>
    `;
    toolbar.appendChild(group);
    toolbar.addEventListener('click', event => {
      const button = event.target.closest('[data-align]');
      if (!button) return;
      const align = button.dataset.align;
      wrapSelection(body, `<p style="text-align:${align}">`, '</p>');
    });
  };

  setInterval(install, 700);
  install();
})();
