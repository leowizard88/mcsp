(() => {
  const isTargetPage = () => document.querySelector('.profile-page, .quote-page');
  const addKoko = () => {
    if (!isTargetPage() || document.querySelector('[data-koko-page-bg]')) return;
    const img = document.createElement('img');
    img.setAttribute('data-koko-page-bg', '');
    img.src = '/assets/img/koko-removebg-preview.png?v=20260707-koko-scroll';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    Object.assign(img.style, {
      position: 'absolute',
      top: '0',
      right: '0',
      width: 'min(48vw, 620px)',
      height: 'auto',
      opacity: '0.8',
      zIndex: '1',
      pointerEvents: 'none',
      userSelect: 'none'
    });
    document.body.appendChild(img);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addKoko, { once: true });
  else addKoko();
})();
