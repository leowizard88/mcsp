(() => {
  const SHISO_IMG = '/assets/img/shiso-tree.svg';
  const canonical = value => String(value || '').trim().toLowerCase();
  const isShiso = value => canonical(value) === 'shiso tree';
  const patch = () => {
    const panel = document.querySelector('.location-panel:not(.is-closed)');
    if (!panel) return;
    const title = panel.querySelector('[data-loc-title]')?.textContent || '';
    const img = panel.querySelector('[data-loc-img]');
    if (!img || !isShiso(title)) return;
    if (!img.src.endsWith('/assets/img/shiso-tree.svg')) {
      img.dataset.fallback = '1';
      img.src = SHISO_IMG;
      img.alt = 'Shiso tree';
    }
  };
  window.addEventListener('greed-location-selected', e => {
    if (isShiso(e.detail?.place)) setTimeout(patch, 80);
  });
  const observer = new MutationObserver(() => patch());
  observer.observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['src','class'] });
  setInterval(patch, 800);
})();
